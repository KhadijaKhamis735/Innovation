// ─────────────────────────────────────────────────────────────
// api/client.js
// ─────────────────────────────────────────────────────────────
// JSON API client built on `fetch`. Handles:
//   - Bearer-token Authorization header on authenticated calls
//   - Single-flight access-token refresh (one shared inflight promise)
//   - Exactly one retry of the original request after a successful
//     refresh, then surface the error to the caller
//   - A structured `ApiError` with status/message/code
//   - Multipart upload (Phase 4 — stub for now)
//
// No Axios, no React Query — keep the dependency surface small.
// ─────────────────────────────────────────────────────────────
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from './tokenStore';
import { API_BASE_URL, authUrl } from './config';

/**
 * Structured error thrown by the client for non-2xx responses.
 * `status === 0` is reserved for network failures (no HTTP response).
 */
export class ApiError extends Error {
  constructor({ status, message, code, cause }) {
    super(message ?? `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    if (cause) this.cause = cause;
  }
}

// ── Token adapter ──────────────────────────────────────────────
// The client must be able to read and write the current tokens
// without depending directly on SecureStore, so we expose a small
// adapter that AuthContext can install. This keeps the client
// testable later without SecureStore.

const tokenAdapter = {
  async readAccess() { return getAccessToken(); },
  async readRefresh() { return getRefreshToken(); },
  async write({ accessToken, refreshToken }) {
    await setTokens({ accessToken, refreshToken });
  },
  async clear() { await clearTokens(); },
};

/** Replace the token adapter (used by AuthContext on logout, etc.). */
export function setTokenAdapter(next) {
  Object.assign(tokenAdapter, next);
}

// ── Single-flight refresh ──────────────────────────────────────
// One shared promise. Concurrent 401s all await the same refresh;
// after it resolves they retry once.

let inflightRefresh = null;

async function refreshAccessToken() {
  const refresh = await tokenAdapter.readRefresh();
  if (!refresh) {
    // No refresh token available — surface a 401 so the caller
    // can route the user to login.
    throw new ApiError({ status: 401, message: 'No refresh token' });
  }
  const res = await fetch(authUrl('/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    // Reuse / expiry / revoked / wrong surface — clear tokens so the
    // next page-load starts from a clean slate.
    await tokenAdapter.clear();
    let body = null;
    try { body = await res.json(); } catch { /* ignore */ }
    throw new ApiError({
      status: res.status,
      message: body?.message ?? 'Refresh failed',
      code: body?.code,
    });
  }
  const data = await res.json();
  await tokenAdapter.write({
    accessToken: data.token,
    refreshToken: data.refreshToken,
  });
  return data.token;
}

function getOrStartRefresh() {
  if (!inflightRefresh) {
    inflightRefresh = (async () => {
      try {
        return await refreshAccessToken();
      } finally {
        // Allow a future refresh to start fresh once this one resolves.
        inflightRefresh = null;
      }
    })();
  }
  return inflightRefresh;
}

// ── Shared refresh pipeline ────────────────────────────────────
// All three exposed calls (apiRequest / apiUpload / apiDownload)
// share the same single-flight refresh + one-retry pipeline via
// withRefreshRetry. Concurrent 401s share one in-flight refresh.

/**
 * Run `doFetch(token)` once; on a 401 with auth enabled, run a
 * single-flight refresh and retry once. The returned Response is
 * never consumed by this helper — callers parse the body in the
 * shape they need (JSON / Blob / text).
 */
async function withRefreshRetry(doFetch, { auth }) {
  let token = auth ? await tokenAdapter.readAccess() : null;
  let res;
  try {
    res = await doFetch(token);
  } catch (e) {
    throw new ApiError({ status: 0, message: 'Network error', cause: e });
  }

  if (res.status === 401 && auth) {
    try {
      token = await getOrStartRefresh();
    } catch (refreshErr) {
      throw refreshErr instanceof ApiError
        ? refreshErr
        : new ApiError({ status: 401, message: 'Refresh failed', cause: refreshErr });
    }
    try {
      res = await doFetch(token);
    } catch (e) {
      throw new ApiError({ status: 0, message: 'Network error', cause: e });
    }
  }
  return res;
}

// ── Core request ───────────────────────────────────────────────

/**
 * Issue a JSON request to the API. When `auth: true` (default),
 * the current access token is attached and a single 401 triggers
 * one refresh + one retry. On a second 401, the error surfaces.
 *
 * @param {string} path e.g. '/login' or '/opportunities' — the
 *        client prepends the API origin for `/api/*` paths.
 * @param {object} opts
 * @param {string} [opts.method='GET']
 * @param {object} [opts.body] JSON-serialisable body
 * @param {boolean} [opts.auth=true]
 * @returns {Promise<any>} parsed JSON response
 */
export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const url = resolveUrl(path);
  const doFetch = async (token) => {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  const res = await withRefreshRetry(doFetch, { auth });
  return parseResponse(res);
}

// ── Multipart upload (Phase 4) ─────────────────────────────────

/**
 * Send a multipart/form-data request. Auth defaults to true.
 * The browser/fetch runtime generates the boundary; do NOT set
 * `Content-Type` manually.
 *
 * @param {string} path
 * @param {FormData} formData
 * @param {object} [opts]
 */
export async function apiUpload(path, formData, { auth = true } = {}) {
  const url = resolveUrl(path);
  const doFetch = async (token) => {
    const headers = { Accept: 'application/json' };
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { method: 'POST', headers, body: formData });
  };

  const res = await withRefreshRetry(doFetch, { auth });
  return parseResponse(res);
}

// ── Authenticated download (Phase 4) ────────────────────────────

/**
 * Authenticated GET that returns the response body as a Blob plus
 * the headers callers need to render it (Content-Type, Content-Length,
 * RFC 5987 Content-Disposition filename). Used by the EvidencePanel
 * to fetch project attachments.
 *
 * @param {string} path
 * @param {object} [opts]
 * @returns {Promise<{
 *   blob: Blob,
 *   contentType: string,
 *   contentLength: number | null,
 *   contentDisposition: string | null,
 *   filename: string | null,
 * }>}
 */
export async function apiDownload(path, { auth = true } = {}) {
  const url = resolveUrl(path);
  const doFetch = async (token) => {
    const headers = { Accept: '*/*' };
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { method: 'GET', headers });
  };

  const res = await withRefreshRetry(doFetch, { auth });
  if (!res.ok) {
    // Mirror parseResponse's ApiError shape for non-2xx responses,
    // but we may not have a JSON body — try to parse, fall back.
    let body = null;
    try { body = await res.json(); } catch { /* not JSON */ }
    throw new ApiError({
      status: res.status,
      message: body?.message ?? res.statusText ?? 'Download failed',
      code: body?.code,
    });
  }

  const contentType = res.headers.get('Content-Type') || 'application/octet-stream';
  const contentLength = parseContentLength(res.headers.get('Content-Length'));
  const contentDisposition = res.headers.get('Content-Disposition');
  const blob = await res.blob();
  return {
    blob,
    contentType,
    contentLength,
    contentDisposition,
    filename: parseContentDispositionFilename(contentDisposition),
  };
}

function parseContentLength(header) {
  if (!header) return null;
  const n = Number(header);
  return Number.isFinite(n) ? n : null;
}

/**
 * Best-effort RFC 5987 filename extraction. Looks for either the
 * legacy `filename=...` or the modern `filename*=UTF-8''...` form.
 * Returns null if neither is present.
 */
export function parseContentDispositionFilename(header) {
  if (!header) return null;
  // RFC 5987: filename*=UTF-8''<percent-encoded>
  const ext = /filename\*\s*=\s*[^']*''([^;]+)/i.exec(header);
  if (ext) {
    try { return decodeURIComponent(ext[1].trim().replace(/^"|"$/g, '')); }
    catch { /* fall through */ }
  }
  // Legacy: filename="..." or filename=...
  const legacy = /filename\s*=\s*("([^"]+)"|([^;]+))/i.exec(header);
  if (legacy) return (legacy[2] ?? legacy[3] ?? '').trim();
  return null;
}

// ── helpers ────────────────────────────────────────────────────

function resolveUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/')) path = `/${path}`;
  // Auth endpoints live under /api/mobile/auth/*; everything else under /api/*.
  if (path.startsWith('/api/mobile/auth')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}${path}`;
}

async function parseResponse(res) {
  const text = await res.text();
  const json = text ? safeJsonParse(text) : null;
  if (!res.ok) {
    throw new ApiError({
      status: res.status,
      message: json?.message ?? res.statusText ?? 'Request failed',
      code: json?.code,
    });
  }
  return json;
}

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

// ── Auth-specific helpers (thin wrappers for clarity) ──────────

export const authApi = {
  register: (payload) => apiRequest('/api/mobile/auth/register', {
    method: 'POST', body: payload, auth: false,
  }),
  login: (payload) => apiRequest('/api/mobile/auth/login', {
    method: 'POST', body: payload, auth: false,
  }),
  refresh: (refreshToken) => apiRequest('/api/mobile/auth/refresh', {
    method: 'POST', body: { refreshToken }, auth: false,
  }),
  logout: (refreshToken) => apiRequest('/api/mobile/auth/logout', {
    method: 'POST', body: { refreshToken }, auth: false,
  }),
  me: () => apiRequest('/api/mobile/auth/me', { method: 'GET' }),
  forgotPassword: (email) => apiRequest('/api/mobile/auth/forgot-password', {
    method: 'POST', body: { email }, auth: false,
  }),
  resetPassword: (token, password) => apiRequest('/api/mobile/auth/reset-password', {
    method: 'POST', body: { token, password }, auth: false,
  }),
  verifyEmail: (token) => apiRequest(`/api/mobile/auth/verify?token=${encodeURIComponent(token)}`, {
    method: 'GET', auth: false,
  }),
  resendVerification: () => apiRequest('/api/mobile/auth/resend-verification', {
    method: 'POST',
  }),
  // Email-bodied resend for users who closed the app right after registering
  // and have no session. Always returns 202 — same anti-enumeration contract
  // as forgot-password. Used by CheckEmailScreen.
  resendVerificationByEmail: (email) => apiRequest('/api/mobile/auth/resend-verification-by-email', {
    method: 'POST', body: { email }, auth: false,
  }),
};