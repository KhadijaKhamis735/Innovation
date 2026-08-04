// ─────────────────────────────────────────────────────────────
// api/projects.js
// ─────────────────────────────────────────────────────────────
// Thin wrapper around `apiRequest`, `apiUpload`, and `apiDownload`
// for the Phase 4 surface:
//
//   GET    /api/projects/me
//   POST   /api/projects
//   GET    /api/projects/{id}
//   PUT    /api/projects/{id}
//   DELETE /api/projects/{id}
//
//   POST   /api/projects/{id}/milestones
//   PATCH  /api/projects/{id}/milestones/{milestoneId}
//   DELETE /api/projects/{id}/milestones/{milestoneId}
//   PATCH  /api/projects/{id}/phase?phase=…
//
//   GET    /api/projects/{id}/attachments
//   POST   /api/projects/{id}/attachments          (multipart)
//   GET    /api/projects/{id}/attachments/{attId} (binary)
//   DELETE /api/projects/{id}/attachments/{attId}
//
// The mobile client never sees the `surface` field's CLUB half on
// the innovator stack — but the response always includes it, so
// `surface` flows through to every screen for future use.
//
// All paths stay relative — `api/client.js` joins them to
// API_BASE_URL via the shared helpers in `api/client.js`.
// ─────────────────────────────────────────────────────────────
import { apiRequest, apiUpload, ApiError } from './client';

export const projectsApi = {
  /** @returns {Promise<Array<Project>>} */
  async listMine() {
    return apiRequest('/api/projects/me', { method: 'GET' });
  },

  /** @returns {Promise<Project>} */
  async getById(id) {
    return apiRequest(`/api/projects/${id}`, { method: 'GET' });
  },

  /** @param {ProjectRequest} payload */
  async create(payload) {
    return apiRequest('/api/projects', { method: 'POST', body: payload });
  },

  /** @param {ProjectRequest} payload */
  async update(id, payload) {
    return apiRequest(`/api/projects/${id}`, { method: 'PUT', body: payload });
  },

  async remove(id) {
    return apiRequest(`/api/projects/${id}`, { method: 'DELETE' });
  },

  /**
   * @param {number} id
   * @param {'idea'|'proposal'|'prototype'|'mvp'|'scaling'} phase
   */
  async updatePhase(id, phase) {
    return apiRequest(`/api/projects/${id}/phase?phase=${encodeURIComponent(phase)}`, {
      method: 'PATCH',
    });
  },

  /** @param {MilestoneRequest} body */
  async addMilestone(id, body) {
    return apiRequest(`/api/projects/${id}/milestones`, { method: 'POST', body });
  },

  /** @param {MilestoneRequest} body */
  async updateMilestone(id, milestoneId, body) {
    return apiRequest(`/api/projects/${id}/milestones/${milestoneId}`, {
      method: 'PATCH', body,
    });
  },

  async removeMilestone(id, milestoneId) {
    return apiRequest(`/api/projects/${id}/milestones/${milestoneId}`, { method: 'DELETE' });
  },

  /** @returns {Promise<Array<ProjectAttachmentResponse>>} */
  async listAttachments(id) {
    return apiRequest(`/api/projects/${id}/attachments`, { method: 'GET' });
  },

  /**
   * Upload an evidence file. The caller builds the FormData with a
   * `file` part (uri/name/type), `kind`, and optional `caption`.
   *
   * @param {number} id
   * @param {FormData} formData
   */
  async uploadAttachment(id, formData) {
    return apiUpload(`/api/projects/${id}/attachments`, formData);
  },

  /**
   * Register external evidence (a URL) instead of uploading a file. Used when
   * the prototype lives on GitHub / YouTube / a hosted page rather than on
   * the device — without this call, the Innovator can't satisfy the
   * PROTOTYPE / MVP evidence gate without uploading a binary blob.
   *
   * Backend contract (POST /api/projects/{id}/attachments/link):
   *   { url: string (required, http/https), caption?: string, kind?: 'evidence' }
   * Response: same ProjectAttachmentResponse shape, with type === 'link'
   * and linkUrl populated.
   *
   * @param {number} id
   * @param {{ url: string, caption?: string, kind?: 'evidence'|'other' }} body
   * @returns {Promise<ProjectAttachmentResponse>}
   */
  async addLinkAttachment(id, body) {
    return apiRequest(`/api/projects/${id}/attachments/link`, {
      method: 'POST',
      body: {
        url: body.url,
        caption: body.caption || undefined,
        kind: body.kind || 'evidence',
      },
    });
  },

  async removeAttachment(id, attachmentId) {
    return apiRequest(`/api/projects/${id}/attachments/${attachmentId}`, { method: 'DELETE' });
  },

  /** Download endpoint path (used with apiDownload). */
  attachmentDownloadPath(id, attachmentId) {
    return `/api/projects/${id}/attachments/${attachmentId}`;
  },
};

/**
 * @typedef {{
 *   id: number,
 *   surface: 'innovation' | 'club',
 *   name: string,
 *   tagline?: string,
 *   description?: string,
 *   category?: string,
 *   phase: 'idea'|'proposal'|'prototype'|'mvp'|'scaling',
 *   tags: string[],
 *   startDate?: string,
 *   zsaId?: string|null,
 *   approvalStatus?: 'pending'|'approved'|'rejected'|null,
 *   ownerUserId?: number,
 *   ownerMemberId?: number,
 *   authorName?: string,
 *   milestones: MilestoneResponse[],
 *   createdAt: string,
 *   updatedAt: string,
 * }} Project
 *
 * @typedef {{
 *   id: number,
 *   name: string,
 *   description?: string,
 *   completed: boolean,
 *   completedDate?: string|null,
 *   position: number,
 *   createdAt: string,
 *   updatedAt: string,
 * }} MilestoneResponse
 *
 * @typedef {{
 *   id: number,
 *   projectId: number,
 *   originalFilename: string,
 *   mimeType: string,
 *   sizeBytes: number,
 *   kind: 'evidence'|'other',
 *   caption?: string,
 *   uploadedByUserId?: number,
 *   uploadedByMemberId?: number,
 *   uploadedByName?: string,
 *   uploadedAt: string,
 * }} ProjectAttachmentResponse
 *
 * @typedef {{
 *   name: string,
 *   tagline?: string,
 *   description?: string,
 *   category?: string,
 *   phase: 'idea'|'proposal'|'prototype'|'mvp'|'scaling',
 *   startDate?: string,
 *   milestones?: Array<{ name: string, description?: string }>,
 *   tags?: string[],
 * }} ProjectRequest
 *
 * @typedef {{
 *   name?: string,
 *   description?: string,
 *   completed?: boolean,
 *   completedDate?: string|null,
 *   position?: number,
 * }} MilestoneRequest
 */

// ── Payload helpers ────────────────────────────────────────────
// Screens stay declarative by going through these. They also
// strip empty strings so backend `@Size` constraints don't fail on
// blank form fields the user never touched.

function trimOrUndef(value) {
  if (value == null) return undefined;
  const t = String(value).trim();
  return t.length ? t : undefined;
}

/**
 * Build a `ProjectRequest` body from the create screen's `form`.
 * Drop blank optional fields; coerce the start date to YYYY-MM-DD.
 */
export function toCreateBody(form) {
  const body = {
    name: String(form.name ?? '').trim(),
    phase: form.phase || 'idea',
  };
  const tagline     = trimOrUndef(form.tagline);
  const description = trimOrUndef(form.description);
  const category    = trimOrUndef(form.category);
  const startDate   = trimOrUndef(form.startDate);
  if (tagline     !== undefined) body.tagline     = tagline;
  if (description !== undefined) body.description = description;
  if (category    !== undefined) body.category    = category;
  if (startDate   !== undefined) body.startDate   = normalizeDate(startDate);

  const tags = parseTags(form.tags);
  if (tags.length) body.tags = tags;

  const milestones = (form.milestones || [])
    .map((m) => ({ name: String(m.name ?? '').trim(), description: trimOrUndef(m.description) }))
    .filter((m) => m.name.length > 0)
    .map((m) => {
      const out = { name: m.name };
      if (m.description !== undefined) out.description = m.description;
      return out;
    });
  if (milestones.length) body.milestones = milestones;

  return body;
}

/**
 * Build a `ProjectRequest` body from the edit-metadata form on the
 * detail screen. Same shape as create but without `phase` (phase
 * has its own PATCH endpoint).
 */
export function toUpdateBody(form) {
  const body = { name: String(form.name ?? '').trim() };
  const tagline     = trimOrUndef(form.tagline);
  const description = trimOrUndef(form.description);
  const category    = trimOrUndef(form.category);
  const startDate   = trimOrUndef(form.startDate);
  if (tagline     !== undefined) body.tagline     = tagline;
  if (description !== undefined) body.description = description;
  if (category    !== undefined) body.category    = category;
  if (startDate   !== undefined) body.startDate   = normalizeDate(startDate);

  const tags = parseTags(form.tags);
  body.tags = tags; // explicit empty array clears; backend accepts []
  return body;
}

/** Build a `MilestoneRequest` body from an in-screen milestone row. */
export function toMilestoneBody(milestone) {
  const body = {};
  const name        = trimOrUndef(milestone.name);
  const description = trimOrUndef(milestone.description);
  if (name        !== undefined) body.name        = name;
  if (description !== undefined) body.description = description;
  if (typeof milestone.completed === 'boolean') body.completed = milestone.completed;
  if ('completedDate' in milestone) {
    body.completedDate = milestone.completedDate
      ? normalizeDate(milestone.completedDate)
      : null;
  }
  if (Number.isInteger(milestone.position)) body.position = milestone.position;
  return body;
}

/** Coerce a date input to the ISO `YYYY-MM-DD` form the backend wants. */
function normalizeDate(value) {
  if (!value) return null;
  // Already YYYY-MM-DD (10 chars, dashes, all digits in positions).
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

/** Split comma-separated tags, trim, drop empties, cap at 20. */
function parseTags(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean).slice(0, 20);
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

// ── Error classification ──────────────────────────────────────
// Mirrors classifyApplyError() in api/opportunities.js. Surfaces
// the most common backend write failures to the Phase 4 screens
// without each screen re-implementing the heuristic.

/**
 * @param {unknown} err
 * @returns {{
 *   kind: 'verification'|'forbidden'|'not_found'|'unauthorized'|
 *         'limit_exceeded'|'validation'|'network'|'server'|'unknown',
 *   message?: string,
 * }}
 */
export function classifyProjectError(err) {
  if (err instanceof ApiError) {
    if (err.status === 0) return { kind: 'network' };
    if (err.status === 401) return { kind: 'unauthorized' };
    if (err.status === 403) {
      const msg = err.message || '';
      if (msg.startsWith('Please verify your email')) return { kind: 'verification' };
      return { kind: 'forbidden', message: msg };
    }
    if (err.status === 404) return { kind: 'not_found', message: err.message };
    if (err.status === 413 || err.status === 422) {
      const m = (err.message || '').toLowerCase();
      if (m.includes('limit') || m.includes('exceeds') || m.includes('maximum') || m.includes('too many')) {
        return { kind: 'limit_exceeded', message: err.message };
      }
      return { kind: 'validation', message: err.message };
    }
    if (err.status >= 500) return { kind: 'server', message: err.message };
    return { kind: 'validation', message: err.message };
  }
  return { kind: 'unknown', message: err?.message ?? 'Unexpected error' };
}
