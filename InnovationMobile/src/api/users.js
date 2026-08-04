// ─────────────────────────────────────────────────────────────
// api/users.js
// ─────────────────────────────────────────────────────────────
// Phase 7 — self-service profile. Endpoints exposed:
//
//   GET   /api/users/me    → current user (already wired via AuthContext)
//   PATCH /api/users/me    → partial update (firstName, lastName, phone,
//                            bio, location, plus six notification booleans)
//
// Mobile /me is provided by AuthContext to keep the auth surface in one
// place. This module ONLY exposes the PATCH so the Settings screen can
// stay declarative about the fields it works with.
//
// All fields are optional in the request body — only the keys you send
// are persisted. The server returns the refreshed projection so the
// client can replace its in-memory user with the source of truth.
// ─────────────────────────────────────────────────────────────
import { apiRequest, ApiError } from './client';

export const usersApi = {
  /**
   * @param {{
   *   firstName?: string,
   *   lastName?: string,
   *   phone?: string,
   *   bio?: string,
   *   location?: string,
   *   emailApplications?: boolean,
   *   emailUpdates?: boolean,
   *   emailReminders?: boolean,
   *   pushApplications?: boolean,
   *   pushUpdates?: boolean,
   *   pushReminders?: boolean,
   * }} patch
   * @returns {Promise<UserResponse>} the refreshed user projection
   */
  async updateMe(patch) {
    return apiRequest('/api/users/me', { method: 'PATCH', body: patch });
  },
};

/**
 * Translate a backend write error into copy the Settings screen can
 * render directly. Reads the same status codes the rest of the
 * application already uses.
 *
 * @returns {{
 *   kind: 'unauthorized' | 'forbidden' | 'validation' | 'network' | 'server' | 'unknown',
 *   message?: string,
 * }}
 */
export function classifyProfileError(err) {
  if (err instanceof ApiError) {
    if (err.status === 0) return { kind: 'network' };
    if (err.status === 401) return { kind: 'unauthorized' };
    if (err.status === 403) return { kind: 'forbidden', message: err.message };
    if (err.status === 400 || err.status === 422) {
      return { kind: 'validation', message: err.message };
    }
    if (err.status >= 500) return { kind: 'server', message: err.message };
    return { kind: 'validation', message: err.message };
  }
  return { kind: 'unknown', message: err?.message ?? 'Unexpected error' };
}

/**
 * @typedef {{
 *   id: number,
 *   email: string,
 *   firstName: string,
 *   lastName: string,
 *   name: string,
 *   role: 'innovator' | 'funder' | 'admin',
 *   sector: string | null,
 *   status: string,
 *   phone: string | null,
 *   bio: string | null,
 *   location: string | null,
 *   avatarUrl: string | null,
 *   emailVerified: boolean,
 *   emailApplications: boolean,
 *   emailUpdates: boolean,
 *   emailReminders: boolean,
 *   pushApplications: boolean,
 *   pushUpdates: boolean,
 *   pushReminders: boolean,
 * }} UserResponse
 */
