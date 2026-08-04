// ─────────────────────────────────────────────────────────────
// api/clubAuth.js
// ─────────────────────────────────────────────────────────────
// Thin wrapper over `apiRequest` for the mobile club auth surface
// at /api/mobile/club/auth/*. Mirrors `authApi` (the innovation
// surface) so screens can switch between them by changing the
// import.
//
//   register                  public — { email, password, fullName,
//                                          universityId, category,
//                                          regNumber?, staffId?,
//                                          graduationYear?,
//                                          organizationName?,
//                                          organizationRole?, bio? }
//   login                     public — { email, password }
//   refresh                   public — { refreshToken }
//   logout                    public — { refreshToken }? → 204
//   me                        auth  — MobileMemberView | MobileLeaderView
//   verifyEmail               public — GET ?token=…
//   resendVerification        auth  — 202
//   resendVerificationByEmail public — { email } → 202 (anti-enumeration)
//   forgotPassword            public — { email } → 202 (anti-enumeration)
//   resetPassword             public — { token, password } → 204
//   listUniversities          public — GET /api/club/auth/universities
//                                   (note: this lives under the web club
//                                   surface, not /api/mobile/club/auth,
//                                   because it has no mobile-specific
//                                   shape and is shared with the web.)
// ─────────────────────────────────────────────────────────────
import { apiRequest } from './client';

export const clubAuthApi = {
  // Public universities roster — shared endpoint with the web club surface.
  listUniversities: () =>
    apiRequest('/api/club/auth/universities', { method: 'GET', auth: false }),

  register: (payload) =>
    apiRequest('/api/mobile/club/auth/register', {
      method: 'POST', body: payload, auth: false,
    }),
  login: (payload) =>
    apiRequest('/api/mobile/club/auth/login', {
      method: 'POST', body: payload, auth: false,
    }),
  refresh: (refreshToken) =>
    apiRequest('/api/mobile/club/auth/refresh', {
      method: 'POST', body: { refreshToken }, auth: false,
    }),
  logout: (refreshToken) =>
    apiRequest('/api/mobile/club/auth/logout', {
      method: 'POST',
      body: refreshToken ? { refreshToken } : {},
      auth: false,
    }),

  me: () => apiRequest('/api/mobile/club/auth/me', { method: 'GET' }),

  verifyEmail: (token) =>
    apiRequest(
      `/api/mobile/club/auth/verify?token=${encodeURIComponent(token)}`,
      { method: 'GET', auth: false },
    ),
  resendVerification: () =>
    apiRequest('/api/mobile/club/auth/resend-verification', {
      method: 'POST',
    }),
  resendVerificationByEmail: (email) =>
    apiRequest('/api/mobile/club/auth/resend-verification-by-email', {
      method: 'POST', body: { email }, auth: false,
    }),

  forgotPassword: (email) =>
    apiRequest('/api/mobile/club/auth/forgot-password', {
      method: 'POST', body: { email }, auth: false,
    }),
  resetPassword: (token, password) =>
    apiRequest('/api/mobile/club/auth/reset-password', {
      method: 'POST', body: { token, password }, auth: false,
    }),
};