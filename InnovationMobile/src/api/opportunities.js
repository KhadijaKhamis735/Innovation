// ─────────────────────────────────────────────────────────────
// api/opportunities.js
// ─────────────────────────────────────────────────────────────
// Thin wrapper around `apiRequest` for the funder + innovator surface:
//
//   GET   /api/opportunities            → public open feed (with ?type=)
//   GET   /api/opportunities/{id}       → detail
//   POST  /api/opportunities/{id}/apply → submit application (innovator)
//   GET   /api/applications/me          → current innovator's applications
//
// Phase 5 (funder surface):
//   GET   /api/opportunities/me             → caller's own opportunities
//                                              (open + closed + draft) with
//                                              per-row applicantCount
//   POST  /api/opportunities                → create (verified funder, APPROVED org)
//   PUT   /api/opportunities/{id}           → edit (owner-only)
//   PATCH /api/opportunities/{id}/status    → close / reopen (owner-only)
//   DELETE /api/opportunities/{id}          → remove (owner or admin)
//
// All paths stay relative — `api/client.js` joins them to API_BASE_URL.
// ─────────────────────────────────────────────────────────────
import { apiRequest, ApiError } from './client';

export const opportunitiesApi = {
  /**
   * @param {{ status?: 'open' | 'closed', type?: string }} [params]
   * @returns {Promise<Array<{
   *   id: number,
   *   funderId: number,
   *   funderName: string,
   *   funderOrganizationName: string,
   *   title: string,
   *   description: string,
   *   type: string,
   *   status: string,
   *   amount: string,
   *   deadline: string,
   *   location: string,
   *   requirements: string | null,
   *   tags: string[],
   *   applicantCount: number,
   *   createdAt: string,
   *   updatedAt: string,
   * }>>}
   */
  async list(params = {}) {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.type)   qs.set('type', params.type);
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest(`/api/opportunities${tail}`, { method: 'GET', auth: false });
  },

  async getById(id) {
    return apiRequest(`/api/opportunities/${id}`, { method: 'GET', auth: false });
  },

  /**
   * @param {number} id
   * @param {{ ideaTitle: string, problemStatement: string, proposedSolution: string, estimatedBudget?: number }} payload
   */
  async apply(id, payload) {
    return apiRequest(`/api/opportunities/${id}/apply`, {
      method: 'POST',
      body: payload,
    });
  },

  // ── Funder surface (Phase 5) ────────────────────────────────────

  /**
   * Authenticated caller's own opportunities (open + closed + draft),
   * newest first. Each row carries `applicantCount`.
   *
   * @returns {Promise<Array<{
   *   id: number,
   *   funderId: number,
   *   funderName: string,
   *   funderOrganizationName: string,
   *   title: string,
   *   description: string,
   *   type: string,
   *   status: string,
   *   amount: string,
   *   deadline: string,
   *   location: string,
   *   requirements: string | null,
   *   tags: string[],
   *   applicantCount: number,
   *   createdAt: string,
   *   updatedAt: string,
   * }>>}
   */
  async listMine() {
    return apiRequest('/api/opportunities/me', { method: 'GET' });
  },

  /**
   * @param {{
   *   title: string,
   *   description: string,
   *   type: string,           // backend enum: GRANT | ACCELERATOR | CHALLENGE | …
   *   amount?: string,
   *   deadline?: string,      // ISO date (YYYY-MM-DD)
   *   location?: string,
   *   requirements?: string,
   *   tags?: string[],
   * }} payload
   */
  async create(payload) {
    return apiRequest('/api/opportunities', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * @param {number} id
   * @param {{
   *   title: string,
   *   description: string,
   *   type: string,
   *   amount?: string,
   *   deadline?: string,
   *   location?: string,
   *   requirements?: string,
   *   tags?: string[],
   * }} payload
   */
  async update(id, payload) {
    return apiRequest(`/api/opportunities/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  /**
   * Close or reopen an opportunity. The backend exposes this as a
   * query-param PATCH so the mobile client doesn't need a DTO shape.
   *
   * @param {number} id
   * @param {'open' | 'closed'} status
   */
  async updateStatus(id, status) {
    return apiRequest(`/api/opportunities/${id}/status?status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    });
  },

  /**
   * Delete an owned opportunity. Admin can delete any; funder only their own.
   * @param {number} id
   */
  async remove(id) {
    return apiRequest(`/api/opportunities/${id}`, { method: 'DELETE' });
  },
};

export const applicationsApi = {
  /** Returns the innovator's own applications, newest first. */
  async listMine() {
    return apiRequest('/api/applications/me', { method: 'GET' });
  },

  /**
   * Phase 6 — returns every application across every opportunity owned by
   * the authenticated funder (admin sees all), newest first. The single
   * source of truth for the funder dashboard "Recent Applications" card
   * and the full Received Applications screen.
   *
   * @returns {Promise<Array<{
   *   id: number,
   *   opportunityId: number,
   *   opportunityTitle: string,
   *   innovatorId: number,
   *   innovatorName: string,
   *   innovatorEmail: string,
   *   ideaTitle: string,
   *   problemStatement: string,
   *   proposedSolution: string,
   *   estimatedBudget: number | null,
   *   stage: 'submitted' | 'under_review' | 'interview' | 'pitch'
   *        | 'shortlisted' | 'accepted' | 'rejected',
   *   appliedAt: string,
   *   updatedAt: string,
   * }>>}
   */
  async listReceived() {
    return apiRequest('/api/applications/received', { method: 'GET' });
  },

  /**
   * Phase 6 — move an application to a new stage. Backend enforces
   * (a) the caller owns the opportunity (or is admin) and (b) the
   * email is verified. Both produce 4xx errors that the screen
   * surfaces via {@link classifyStageUpdateError}.
   *
   * @param {number} id application id
   * @param {'submitted' | 'under_review' | 'interview' | 'pitch'
   *        | 'shortlisted' | 'accepted' | 'rejected'} stage
   * @returns {Promise<object>} the updated ApplicationResponse
   */
  async updateStage(id, stage) {
    return apiRequest(`/api/applications/${id}/stage`, {
      method: 'PATCH',
      body: { stage },
    });
  },
};

/**
 * Translate a backend write error into something the Phase 3/5 surfaces
 * (apply, dashboard, list, post-form) can show without each screen
 * re-implementing the heuristic.
 *
 * Returns one of:
 *   - { kind: 'verification' }   → user must verify email
 *   - { kind: 'duplicate' }      → already applied to this opportunity
 *   - { kind: 'closed' }         → opportunity is no longer open
 *   - { kind: 'unauthorized' }   → 401 — sign-in flow handles this
 *   - { kind: 'forbidden', message }
 *   - { kind: 'validation', message }
 *   - { kind: 'network' }        → status 0 — connection down
 *   - { kind: 'server', message }
 *   - { kind: 'unknown', message }
 */
export function classifyApplyError(err) {
  if (err instanceof ApiError) {
    if (err.status === 0) return { kind: 'network' };
    if (err.status === 401) return { kind: 'unauthorized' };
    if (err.status === 403) {
      const msg = err.message || '';
      if (msg.startsWith('Please verify your email')) return { kind: 'verification' };
      return { kind: 'forbidden', message: msg };
    }
    if (err.status === 404) return { kind: 'closed', message: 'Opportunity no longer available' };
    if (err.status === 409) return { kind: 'duplicate' };
    if (err.status === 410) return { kind: 'closed' };
    if (err.status === 400 || err.status === 422) {
      return { kind: 'validation', message: err.message };
    }
    return { kind: 'server', message: err.message };
  }
  return { kind: 'unknown', message: err?.message ?? 'Unexpected error' };
}

/**
 * Convenience helpers for the funder surfaces — same status mapping as
 * {@link classifyApplyError} but with copy tuned to "your post failed" rather
 * than "you couldn't apply".
 */
export function classifyFunderWriteError(err) {
  const c = classifyApplyError(err);
  if (c.kind === 'forbidden') return c; // pass through — already user-facing copy
  return c;
}

/**
 * Phase 6 — translate a backend stage-PATCH error into something the
 * ReceivedApplications screen can render in a toast. The mapping is the
 * same as {@link classifyApplyError} but the verification branch is
 * explicit so the screen can route the user to the verification flow.
 */
export function classifyStageUpdateError(err) {
  return classifyApplyError(err);
}
