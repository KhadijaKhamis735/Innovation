// ─────────────────────────────────────────────────────────────
// __tests__/api/auth.test.js
// ─────────────────────────────────────────────────────────────
// Phase 2 — pin the authApi.verify / forgot / reset / resend
// contracts that the deep-link + recovery flow depends on.
//
// The deep-link layer is wired to these exact paths and JSON
// shapes; a stray path drift or body-shape change would silently
// break verification + password reset. We pin the path + method +
// JSON body for each helper.
//
// apiRequest's parsing/refresh logic is already covered by
// __tests__/api/client.test.js, so we don't re-test that here.
// ─────────────────────────────────────────────────────────────
import { authApi } from '../../src/api/client';
import { ApiError } from '../../src/api/client';

// Helper: capture the most recent fetch call as { url, init }.
function lastCall() {
  expect(global.fetch).toHaveBeenCalled();
  const [url, init] = global.fetch.mock.calls.at(-1);
  return { url, init };
}

// Helper: build a generic OK response with a JSON body.
function okJson(status = 200, body = {}) {
  return {
    ok: true,
    status,
    text: async () => JSON.stringify(body),
  };
}

describe('authApi.forgotPassword', () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  test('POSTs the trimmed email to /api/mobile/auth/forgot-password', async () => {
    global.fetch.mockResolvedValueOnce(okJson(202, {}));

    await authApi.forgotPassword('Lost@inbox.com');

    const { url, init } = lastCall();
    expect(url).toMatch(/\/api\/mobile\/auth\/forgot-password$/);
    expect(init.method).toBe('POST');
    // No Authorization header on a public endpoint.
    expect(init.headers?.Authorization).toBeUndefined();
    expect(JSON.parse(init.body)).toEqual({ email: 'Lost@inbox.com' });
  });

  test('returns silently on 202 even for an unknown email (anti-enumeration)', async () => {
    global.fetch.mockResolvedValueOnce(okJson(202, {}));

    // No throw — forgotPassword is fire-and-forget from the client's POV.
    await expect(authApi.forgotPassword('nobody@example.com')).resolves.toBeDefined();
  });
});

describe('authApi.resetPassword', () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  test('POSTs { token, password } to /api/mobile/auth/reset-password', async () => {
    global.fetch.mockResolvedValueOnce(okJson(204, {}));

    await authApi.resetPassword('raw-token-abc', 'Newpass1');

    const { url, init } = lastCall();
    expect(url).toMatch(/\/api\/mobile\/auth\/reset-password$/);
    expect(init.method).toBe('POST');
    expect(init.headers?.Authorization).toBeUndefined();
    expect(JSON.parse(init.body)).toEqual({ token: 'raw-token-abc', password: 'Newpass1' });
  });

  test('throws ApiError(400) when the token is invalid', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'Reset token invalid' }),
    });

    await expect(authApi.resetPassword('expired', 'Newpass1'))
      .rejects.toMatchObject({
        name: 'ApiError',
        status: 400,
        message: 'Reset token invalid',
      });
  });
});

describe('authApi.verifyEmail', () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  test('GETs /api/mobile/auth/verify with the raw token (URL-encoded)', async () => {
    global.fetch.mockResolvedValueOnce(okJson(200, { verified: true, message: 'Email verified' }));

    await authApi.verifyEmail('abc/def+=');

    const { url, init } = lastCall();
    // The token is URL-encoded into the query string.
    expect(url).toContain('/api/mobile/auth/verify?token=');
    expect(decodeURIComponent(url)).toContain('token=abc/def+=');
    expect(init.method).toBe('GET');
    expect(init.headers?.Authorization).toBeUndefined();
  });

  test('returns the { verified, message } payload on success', async () => {
    global.fetch.mockResolvedValueOnce(okJson(200, { verified: true, message: 'Email verified' }));

    const r = await authApi.verifyEmail('tok');
    expect(r).toEqual({ verified: true, message: 'Email verified' });
  });

  test('throws ApiError(400) when the token is unknown / expired / consumed', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'Verification token invalid' }),
    });

    await expect(authApi.verifyEmail('expired'))
      .rejects.toMatchObject({ name: 'ApiError', status: 400 });
  });
});

describe('authApi.resendVerification', () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  test('POSTs to /api/mobile/auth/resend-verification', async () => {
    global.fetch.mockResolvedValueOnce(okJson(202, {}));

    await authApi.resendVerification();

    const { url, init } = lastCall();
    expect(url).toMatch(/\/api\/mobile\/auth\/resend-verification$/);
    expect(init.method).toBe('POST');
    // No body — the endpoint derives the recipient from the JWT.
    expect(init.body).toBeUndefined();
  });
});

describe('authApi.resendVerificationByEmail', () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  test('POSTs the email to /api/mobile/auth/resend-verification-by-email', async () => {
    global.fetch.mockResolvedValueOnce(okJson(202, {}));

    await authApi.resendVerificationByEmail('just-registered@example.com');

    const { url, init } = lastCall();
    expect(url).toMatch(/\/api\/mobile\/auth\/resend-verification-by-email$/);
    expect(init.method).toBe('POST');
    expect(init.headers?.Authorization).toBeUndefined();
    expect(JSON.parse(init.body)).toEqual({ email: 'just-registered@example.com' });
  });

  test('returns silently on 202 (anti-enumeration)', async () => {
    global.fetch.mockResolvedValueOnce(okJson(202, {}));

    await expect(authApi.resendVerificationByEmail('unknown@example.com'))
      .resolves.toBeDefined();
  });
});