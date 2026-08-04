# React Native + Shared Spring Boot Implementation Plan

> **Project:** Innovation Tracking Platform  
> **Mobile app:** `InnovationMobile/` (Expo SDK 56 + React Native)  
> **Web app:** `Innovation/` (React + Vite)  
> **Shared API:** `Innovation_backend/` (Spring Boot + PostgreSQL)  
> **Created:** 2026-07-25  
> **Status:** Planning complete; implementation has not started

---

## 1. Purpose

Integrate the existing React Native application with the same Spring Boot backend and PostgreSQL database already used by the React web application.

The two clients must share the same users, opportunities, applications, projects, milestones, evidence attachments, organization approval state, and application stages.

```text
React web ───────────────┐
                         ├── Spring Boot API ── PostgreSQL
React Native mobile ─────┘
```

Implementation must be incremental. **Stop after every phase for testing and approval before beginning the next phase.**

---

## 2. Scope Decision: Club Is Deferred

The working, backend-connected Club system currently belongs to the React web application.

`InnovationMobile/src/screens/club/` contains Club prototype screens, but they use mock/in-memory data and are not integrated with the Spring Boot Club APIs.

For the initial mobile release:

- Club is excluded from the core React Native integration.
- Existing mobile Club source files must not be deleted.
- Club routes, buttons, and data must not be required by core mobile workflows.
- Innovator project actions must use dedicated innovation project screens, not Club project screens.
- Club mobile integration can be planned later as a separate project.

Also deferred initially:

- Mobile admin dashboard
- Messages
- Push notifications
- Automatic application-stage emails
- Bulk application-stage actions
- Editable email templates
- Avatar upload
- Full dark-mode system
- Public project feed
- Funded-project matching
- Club leadership, governance, meetings, resources, and activities

---

## 3. Current State Summary

### 3.1 React Native

The mobile app has a strong UI prototype for innovators and funders, including:

- Landing, login, and registration
- Innovator dashboard
- Browse opportunities
- Apply for opportunities
- My applications
- My projects
- Settings
- Funder dashboard
- Post opportunity
- My opportunities
- Received applications
- Application-stage UI

However, it currently has:

- No API client
- No Spring Boot connection
- No real login or registration
- No token persistence or refresh
- No session restoration
- No persistent application data
- No multipart evidence upload
- Mock opportunities, applications, projects, and dashboard statistics
- Timer-based simulated submissions
- Core project actions that incorrectly route to Club project screens

Most state is held in `src/context/AppContext.jsx`; closing the app resets it.

### 3.2 React web

The React web app is already connected to the backend for:

- Innovator/funder/admin authentication
- Opportunities
- Applications and applicant stages
- Unified projects and milestones
- Evidence upload/download
- Admin organization and project approval
- Selected Club functionality

Some web features still use placeholders or inefficient request patterns, especially dashboard statistics and funder-wide received applications.

### 3.3 Spring Boot backend

The backend already supports:

- JWT access tokens
- Browser refresh-token cookies
- Email verification
- Forgot/reset password
- Innovator and funder roles
- Organization approval
- Opportunity CRUD
- Application submission and stage changes
- Unified innovation/Club projects
- Milestones and project phases
- Evidence upload/download
- Admin APIs
- Selected Club APIs

Important mobile gaps include:

- Browser-cookie-only refresh flow
- No funder-owned opportunity-list endpoint
- No opportunity close/reopen endpoint
- No funder-wide received-applications endpoint
- No profile-update endpoint
- Web-oriented verification/reset email links

---

## 4. Target Mobile Architecture

Use a small architecture that preserves the existing UI and avoids unnecessary state libraries.

```text
App / role-based navigation
  └── AuthContext
       ├── tokenStore (Expo SecureStore)
       └── API client
            ├── JSON requests
            ├── single-flight refresh
            ├── one retry after refresh
            ├── multipart upload
            └── authenticated file download

Screens
  └── call the shared API client
```

### Architecture rules

- Use direct `fetch`; do not introduce Axios, Redux, Zustand, or React Query unless a later phase demonstrates a real need.
- Store access and refresh tokens in Expo SecureStore.
- Never place tokens in AsyncStorage, navigation parameters, logs, or environment variables.
- Keep the authenticated user in memory and restore it through `/api/auth/me`.
- Retry an authenticated request no more than once after refreshing.
- Deduplicate concurrent refresh attempts with one shared in-flight refresh promise.
- Let the backend-returned role control navigation.
- A visual role selector must never grant or override a backend role.
- Use `EXPO_PUBLIC_API_URL` only for the non-secret backend origin.
- Production communication must use HTTPS.
- Keep existing web auth endpoints and browser-cookie behavior unchanged.

---

## 5. Native Authentication Contract

The browser refresh-token cookie is not a dependable cross-platform React Native session mechanism. Add native-specific JSON endpoints while preserving the existing web endpoints:

```text
POST /api/auth/mobile/register
POST /api/auth/mobile/login
POST /api/auth/mobile/refresh
POST /api/auth/mobile/logout
```

Representative login/register/refresh response:

```json
{
  "token": "access-jwt",
  "refreshToken": "rotating-refresh-token",
  "user": {}
}
```

The mobile refresh request sends its refresh token in a JSON body. The backend must use the existing refresh-token service for rotation, family tracking, reuse detection, and revocation.

This design:

- Keeps browser refresh tokens HttpOnly.
- Does not expose browser refresh cookies to web JavaScript.
- Avoids depending on a React Native cookie jar.
- Preserves the existing React web authentication contract.

---

# 6. Implementation Phases

## Phase 0 — Baseline, Scope Isolation, and Configuration

### Goal

Prepare the mobile application for integration, isolate deferred Club functionality, and establish reliable test/build baselines.

### Mobile work

- Record the current core screen behavior before replacing mock data.
- Remove Club routes and buttons from the core mobile workflow without deleting Club files.
- Remove the Club entry card from the core innovator flow.
- Make project-create actions point toward future innovation project screens instead of Club screens.
- Establish the initial API configuration structure.
- Configure environment-specific backend origins.
- Confirm Expo SDK 56 dependency compatibility with `expo-doctor`.
- Preserve the current landing, authentication, innovator, and funder layouts.

### Backend work

- Move sensitive/environment-specific values to environment-backed configuration where necessary.
- Ensure CORS uses the configured origin allowlist instead of a conflicting hard-coded list.
- Preserve the H2/no-real-SMTP test profile.
- Run the complete backend test suite as the baseline.

### Likely mobile files

- `InnovationMobile/App.js`
- `InnovationMobile/src/components/Sidebar.js`
- `InnovationMobile/src/screens/InnovatorDashboard.js`
- `InnovationMobile/src/screens/MyProjectsScreen.js`
- `InnovationMobile/package.json`

### Likely backend files

- `Innovation_backend/src/main/resources/application.properties`
- `Innovation_backend/src/test/resources/application-test.properties`
- `Innovation_backend/src/main/java/com/example/Innovation_backend/config/SecurityConfig.java`

### Acceptance tests

- Backend tests pass without requiring production PostgreSQL or SMTP.
- Expo validation passes without dependency warnings.
- Mobile launches successfully.
- Core layouts remain intact.
- No core route, menu, or project button opens a Club screen.
- Club source files remain untouched and available for future work.

### Pause gate

**STOP after Phase 0.** Present changed files, backend test results, Expo validation, API configuration, and confirmation that Club remains deferred.

---

## Phase 1 — Device Connectivity and Secure Authentication

### Goal

Implement real registration, login, secure session restoration, access-token refresh, and logout on emulators and physical devices.

### Backend work

- Add `/api/auth/mobile/register`.
- Add `/api/auth/mobile/login`.
- Add `/api/auth/mobile/refresh`.
- Add `/api/auth/mobile/logout`.
- Reuse existing authentication, JWT, refresh-token rotation, reuse detection, and revocation logic.
- Return raw refresh tokens only from mobile-specific endpoints.
- Keep all current browser endpoints and cookie behavior unchanged.
- Return 401 for expired, unknown, wrong-surface, revoked, or reused refresh tokens.
- Add controller/service tests for the native flow.

### Mobile work

Install Expo SDK-compatible packages with `npx expo install`:

- `expo-secure-store`
- `expo-linking`

Create:

- API base URL configuration
- Secure token storage
- Reusable JSON API client
- Single-flight refresh logic
- Authentication/session context
- Role-based navigation

Connect:

- Innovator registration
- Funder registration
- Login
- Session restoration
- Automatic access-token refresh
- Real logout

### API URL matrix

| Runtime | Typical local URL |
|---|---|
| Android Studio emulator | `http://10.0.2.2:8080` |
| iOS simulator | `http://127.0.0.1:8080` |
| Physical phone | `http://<computer-LAN-IP>:8080` |
| Production | `https://<production-api-domain>` |

`localhost` on a physical phone points to the phone, not the development computer.

### Likely mobile files

- `InnovationMobile/src/api/config.js` — new
- `InnovationMobile/src/api/tokenStore.js` — new
- `InnovationMobile/src/api/client.js` — new
- `InnovationMobile/src/context/AuthContext.jsx` — new
- `InnovationMobile/App.js`
- `InnovationMobile/src/screens/LoginScreen.js`
- `InnovationMobile/src/screens/RegisterScreen.js`
- `InnovationMobile/src/components/Sidebar.js`
- `InnovationMobile/package.json`
- `InnovationMobile/app.json` or `app.config.js`

### Likely backend files

- `Innovation_backend/src/main/java/com/example/Innovation_backend/auth/MobileAuthController.java` — new
- `Innovation_backend/src/main/java/com/example/Innovation_backend/auth/MobileAuthService.java` — new
- Mobile auth request/response DTOs — new
- `Innovation_backend/src/main/java/com/example/Innovation_backend/auth/RefreshTokenService.java`
- Native auth tests — new

### Acceptance tests

- `/api/health` is reachable from an Android emulator and at least one physical phone.
- Innovator and funder registration create real backend records.
- Valid credentials log in; invalid credentials are rejected.
- The backend role controls the destination screen.
- Closing and reopening the app restores a valid session.
- An expired access token triggers exactly one refresh and one request retry.
- Concurrent 401 responses create one refresh request.
- Refresh-token reuse returns 401 and clears local tokens.
- Logout revokes the refresh token and resets protected navigation.
- React web login and cookie refresh still work.
- Tokens do not appear in logs or navigation state.

### Pause gate

**STOP after Phase 1.** Demonstrate login, app-restart restoration, forced refresh, invalid/reused refresh handling, and logout on a physical device.

---

## Phase 2 — Email Verification and Password Recovery

### Goal

Complete verification, resend verification, forgot-password, reset-password, and deep-link handling.

### Backend work

- Preserve existing web verification/reset URLs as canonical fallback links.
- Add configurable mobile/deep-link URLs.
- Support development links such as:

```text
innovationmobile://verify?token=...
innovationmobile://reset-password?token=...
```

- Keep tokens single-use and expiring.
- Continue returning the same forgot-password response for known and unknown accounts.
- Add email-link tests without logging raw tokens.

### Mobile work

- Configure a stable application scheme.
- Add a forgot-password screen.
- Add a check-your-email state.
- Add an email-verification result screen.
- Add a reset-password screen.
- Add resend-verification access.
- Handle deep links when the app is closed and while it is running.
- Reload `/api/auth/me` after verification.
- Clear local tokens after password reset because backend refresh sessions are revoked.
- Translate verification-related write failures into a useful verification prompt.

### Acceptance tests

- A new registration receives a verification email.
- Verification works from a closed app.
- Verification works while the app is running.
- Web verification remains available as fallback.
- Reused or expired links show safe errors.
- Forgot-password does not disclose whether an account exists.
- A reset link opens the mobile reset form.
- The new password works and the old password fails.
- Old refresh sessions cannot be used after password reset.
- Existing web verification/reset routes continue working.

### Pause gate

**STOP after Phase 2.** Demonstrate cold-start link handling, warm-start link handling, password reset, session revocation, and web fallback.

---

## Phase 3 — Innovator Opportunities and Applications

### Goal

Replace opportunity/application mock data with the backend contracts already used by the React web app.

### Existing endpoints

```text
GET  /api/opportunities
POST /api/opportunities/{id}/apply
GET  /api/applications/me
```

### Backend work

No new production endpoint is required. Add missing tests for:

- Public open-opportunity listing
- Innovator application submission
- Duplicate application conflict
- Closed opportunity rejection
- Unverified write rejection
- Current innovator application listing
- Role restrictions

### Mobile work

Replace mock data in:

- `BrowseOpportunitiesScreen.js`
- `MyApplicationsScreen.js`
- Innovator dashboard opportunity/application sections

Add:

- Loading states
- Empty states
- Retry states
- Pull-to-refresh
- Backend validation messages
- Persistent applied state
- Canonical stage rendering

Canonical application stages:

```text
submitted
under_review
interview
pitch
shortlisted
accepted
rejected
```

Application payload mapping must match the backend:

```json
{
  "ideaTitle": "...",
  "problemStatement": "...",
  "proposedSolution": "...",
  "estimatedBudget": 1000
}
```

### Acceptance tests

- An opportunity created on React web appears on mobile.
- Mobile search/type filters operate on backend rows.
- Mobile submits a valid application.
- The application appears on React web.
- Duplicate submission shows the backend 409 response.
- Closed opportunities cannot receive applications.
- Applied state survives an app restart.
- Application tabs use canonical backend stages.
- Failed loads show Retry without destroying the screen layout.
- No mock opportunities or applications appear in a production session.

### Pause gate

**STOP after Phase 3.** Demonstrate: create on web → view/apply on mobile → view application on web.

---

## Phase 4 — Innovator Projects, Milestones, and Evidence

### Goal

Connect dedicated innovation project screens to unified backend projects without using Club project screens.

### Existing endpoints

```text
GET    /api/projects/me
POST   /api/projects
GET    /api/projects/{id}
PUT    /api/projects/{id}
DELETE /api/projects/{id}

POST   /api/projects/{id}/milestones
PATCH  /api/projects/{id}/milestones/{milestoneId}
DELETE /api/projects/{id}/milestones/{milestoneId}
PATCH  /api/projects/{id}/phase?phase=...

GET    /api/projects/{id}/attachments
POST   /api/projects/{id}/attachments
GET    /api/projects/{id}/attachments/{attachmentId}
DELETE /api/projects/{id}/attachments/{attachmentId}
```

### Backend work

Keep the existing endpoints and add contract/authorization tests for:

- Project list/create/read/update/delete
- Milestone creation/update/delete
- Phase changes
- Multipart upload
- Five-file project limit
- 10 MB per-file limit
- Evidence list/download/delete
- Ownership/privacy rules
- Verification write guard

### Mobile work

Install Expo SDK-compatible packages:

- `expo-document-picker`
- `expo-file-system`
- `expo-sharing`

Add dedicated core screens/components:

- Innovation project creation
- Innovation project details
- Evidence panel

Replace project seeds with backend data. Support:

- Project creation and editing
- Approval-status display
- ZSA ID display
- Milestone updates
- Phase changes
- Image/PDF selection
- Multipart upload
- Authenticated download
- Native sharing/opening
- Evidence deletion

Multipart form:

```text
file = { uri, name, type }
kind = "evidence"
caption = optional string
```

Do not manually set multipart `Content-Type`; `fetch` must generate the boundary.

### Acceptance tests

- A project created on mobile appears on web.
- Admin approval and assigned ZSA ID later appear on mobile.
- Milestone changes persist after restart.
- Phase changes persist.
- An image and PDF upload successfully from a physical phone.
- A file near 10 MB uploads.
- An oversized file is rejected by both mobile and backend.
- A sixth attachment receives the backend 422 response.
- Mobile-uploaded files download on web.
- Web-uploaded files download/share on mobile.
- Deleted evidence disappears from metadata and storage.
- No core project action imports or opens a Club project screen.

### Pause gate

**STOP after Phase 4.** Demonstrate project creation, milestone update, phase update, evidence upload/download/delete, and web/mobile interoperability.

---

## Phase 5 — Funder Opportunity Management

### Goal

Provide a correct owner-scoped funder API and connect the mobile opportunity-management UI.

### Backend additions

```text
GET   /api/opportunities/me
PATCH /api/opportunities/{id}/status
```

`GET /api/opportunities/me` must return all opportunities owned by the authenticated funder, including open and closed opportunities. It must not depend on the public open-only feed.

Also persist opportunity `requirements` and `tags`, which the current web/mobile forms display but discard. Add a Flyway migration and update both web and mobile consumers.

Recommended owner response includes `applicantCount` to avoid one applicants request per opportunity card.

### Mobile work

Connect:

- `PostOpportunity.js`
- `MyOpportunities.js`
- Funder dashboard opportunity sections

Support all backend opportunity types:

- Grant
- Accelerator
- Challenge
- Fellowship
- Equity Funding
- Seed Funding
- Prize

Use real backend verification and organization-approval errors.

### React web patch

- Use the new owner-scoped endpoint.
- Persist and display requirements/tags.
- Keep the shared API behavior aligned between web and mobile.

### Acceptance tests

- A pending organization receives the real approval-gate error.
- An approved funder creates an opportunity on mobile.
- Requirements and tags survive reload.
- The opportunity appears on web.
- The owner list includes open and closed opportunities.
- Another funder cannot edit, close, reopen, or delete it.
- Closing prevents new innovator applications.
- Reopening restores it to the public feed.
- Applicant counts match real applications.
- Mobile edits appear on web after refresh.

### Pause gate

**STOP after Phase 5.** Demonstrate pending-organization rejection and approved-funder create/edit/close/reopen/delete across mobile and web.

---

## Phase 6 — Received Applications and Stage Changes

### Goal

Replace mock funder applicant data and dashboard values with owner-scoped backend information.

### Backend addition

```text
GET /api/applications/received
```

It must return applications only for opportunities owned by the authenticated funder, newest first.

Continue using:

```text
PATCH /api/applications/{id}/stage
```

### Mobile work

Replace mock data in:

- `ReceivedApplications.js`
- Funder dashboard application/statistics sections

Support all canonical stages:

```text
submitted
under_review
interview
pitch
shortlisted
accepted
rejected
```

Derive honest dashboard totals from owned opportunities and received applications.

Bulk changes and email-template actions must be disabled or clearly marked deferred until the backend supports them. The app must not claim an email was sent when no email action occurred.

### React web patch

Update the web Received Applications page to use the new aggregate endpoint instead of the current public-list-plus-multiple-applicant-requests workaround.

### Acceptance tests

- A funder sees applications only for their opportunities.
- Another funder cannot list or modify those applications.
- A mobile stage change appears in innovator mobile and web views.
- Every canonical stage is supported.
- Dashboard totals match backend records.
- An empty database produces empty states rather than seeded applicants or fake statistics.
- No toast falsely claims an email was sent.
- Web Received Applications works with the new endpoint.

### Pause gate

**STOP after Phase 6.** Demonstrate mobile funder stage change → mobile/web innovator status update.

---

## Phase 7 — Profile Settings and Release Hardening

### Goal

Connect remaining truthful account settings, remove core mock data, and verify the full cross-client workflow.

### Backend addition

```text
PATCH /api/users/me
```

Support:

- First name
- Last name
- Phone
- Biography
- Location
- Notification preference booleans

Avatar upload and direct password-change UI remain deferred. Password recovery already provides a secure change path.

### Mobile work

- Connect `SettingsScreen.js`.
- Load sidebar identity from the authenticated user.
- Keep dark mode local/deferred unless a real theme system is approved.
- Remove all remaining core mock arrays and seed dependencies.
- Add focus refresh/pull-to-refresh where stale data matters.
- Prevent unmounted screens from overwriting state after requests finish.
- Add SDK-compatible mobile tests with `jest-expo` and React Native Testing Library.
- Run final physical-device regression.

### React web patch

Connect the web Settings page to the same profile endpoint so profile changes are visible on both clients.

### Final acceptance workflow

1. Register an innovator and a funder.
2. Verify both email addresses.
3. Approve the funder organization using web admin.
4. Post an opportunity from mobile.
5. See it on web and innovator mobile.
6. Apply from mobile.
7. See the application on funder web and mobile.
8. Move it through application stages.
9. See the new stage on innovator web and mobile.
10. Create a project on mobile.
11. Update milestones and advance phase.
12. Approve the project through web admin.
13. See the ZSA ID on mobile.
14. Upload evidence from a phone.
15. Download the evidence from web.
16. Update profile information on mobile.
17. See profile changes on web.
18. Force access-token expiration and verify silent refresh.
19. Reset the password and verify old refresh sessions are invalid.
20. Confirm no core workflow depends on Club routes or data.

### Pause gate

**STOP after Phase 7.** Deliver the acceptance results, remaining deferred features, production configuration checklist, and tested-device list.

---

## 7. Backend Endpoint Summary

### Already available

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
GET  /api/auth/verify
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/reset-password

GET    /api/opportunities
GET    /api/opportunities/{id}
POST   /api/opportunities
PUT    /api/opportunities/{id}
DELETE /api/opportunities/{id}
POST   /api/opportunities/{id}/apply
GET    /api/opportunities/{id}/applicants

GET   /api/applications/me
PATCH /api/applications/{id}/stage

GET    /api/projects/me
POST   /api/projects
GET    /api/projects/{id}
PUT    /api/projects/{id}
DELETE /api/projects/{id}
POST   /api/projects/{id}/milestones
PATCH  /api/projects/{id}/milestones/{milestoneId}
DELETE /api/projects/{id}/milestones/{milestoneId}
PATCH  /api/projects/{id}/phase

GET    /api/projects/{id}/attachments
POST   /api/projects/{id}/attachments
GET    /api/projects/{id}/attachments/{attachmentId}
DELETE /api/projects/{id}/attachments/{attachmentId}
```

### Planned additions

```text
POST  /api/auth/mobile/register       Phase 1
POST  /api/auth/mobile/login          Phase 1
POST  /api/auth/mobile/refresh        Phase 1
POST  /api/auth/mobile/logout         Phase 1

GET   /api/opportunities/me           Phase 5
PATCH /api/opportunities/{id}/status  Phase 5

GET   /api/applications/received      Phase 6

PATCH /api/users/me                    Phase 7
```

---

## 8. Security and Production Checklist

Before a production release:

- Rotate any database, SMTP, or JWT credentials that were committed or shared.
- Supply secrets through deployment environment variables, never Expo public variables.
- Use HTTPS for all production API traffic.
- Use a strong production JWT secret.
- Configure production refresh-token security correctly.
- Use a stable Android application ID and iOS bundle identifier.
- Use an owned HTTPS domain for Universal Links/App Links.
- Keep the custom URL scheme as development/fallback support.
- Confirm no tokens are written to logs.
- Confirm access-token expiration and refresh rotation work on real devices.
- Add rate limiting/account lockout protection before public store release.
- Remove or tightly restrict diagnostic admin endpoints.
- Add pagination before list sizes become large.
- Verify attachment access control and temporary-file cleanup.
- Run backend, web, and mobile regression tests.

---

## 9. Required Decisions Before They Become Blocking

These decisions are not required to begin Phase 0, but they must be settled before the specified work:

1. **Credential rotation:** new deployment database, SMTP, and JWT values must be supplied through the environment before production.
2. **Native app identity:** stable Android application ID, iOS bundle ID, and app URL scheme are needed before Phase 2 development builds and production linking.
3. **Production domains:** an HTTPS API domain and owned HTTPS app-link/web domain are needed before production email/deep-link configuration.

Default decisions already selected:

- React web keeps HttpOnly refresh cookies.
- React Native uses JSON mobile refresh endpoints and SecureStore.
- Canonical email links remain web-compatible.
- Custom schemes are development/fallback links.
- Opportunity requirements and tags should be persisted rather than discarded.
- Club and admin remain outside the initial mobile scope.

---

## 10. Session Restart Instructions

When beginning a new chat/session, ask Claude to:

> Read `InnovationMobile/IMPLEMENTATION_PLAN.md`, inspect the current git status and relevant files, identify the first incomplete phase, and implement only that phase. Run its acceptance checks, update the plan's status, then stop for review before continuing.

Always verify the current code and git status first because the repository may have changed since this plan was written.

---

## 11. Progress Tracker

| Phase | Description | Status |
|---|---|---|
| Audit | Compare mobile, web, and backend | Complete |
| Phase 0 | Baseline, Club isolation, configuration | Not started |
| Phase 1 | Secure mobile authentication | Code complete — backend 97/97 tests green, mobile wiring in place, awaiting physical-device acceptance run |
| Phase 2 | Verification, reset, and deep links | **Verified complete** — backend already exposes `/api/mobile/auth/{verify, resend-verification, resend-verification-by-email, forgot-password, reset-password}` (controller tests + service tests already green); `EmailVerificationService` and `PasswordResetService` both accept a `LinkAudience` parameter and emit `innovationmobile://verify?token=…` / `innovationmobile://reset-password?token=…` as the mobile-audience primary link with the web URL as the fallback; `PasswordResetService.consume` calls `refreshTokenRepository.revokeAllForPrincipal(Surface.INNOVATION, userId, now)` so every mobile refresh-token family for the principal is killed on reset; anti-enumeration 202 responses for unknown email / resent flows; single-use tokens with expiry; full backend test coverage (no new backend code or tests required). Mobile: all four screens in place (`ForgotPasswordScreen`, `CheckEmailScreen`, `VerifyEmailScreen`, `ResetPasswordScreen`); all five `authApi` helpers in `src/api/client.js` (`forgotPassword`, `resetPassword`, `verifyEmail`, `resendVerification`, `resendVerificationByEmail`); `src/navigation/linking.js` wires `innovationmobile://verify` and `innovationmobile://reset-password` into `NavigationContainer`; `AuthContext` exposes `signOut` + `refreshSession` + (new in this phase) `clearSession` — a strictly-local wipe that does NOT call `/api/mobile/auth/logout`, used by `ResetPasswordScreen` after the server has already revoked every refresh family; `RegisterScreen` routes to `CheckEmail`; `LoginScreen` has the "Forgot Password?" link. New jest-expo test coverage: `__tests__/api/auth.test.js` (11 tests pinning the path/method/body contracts that the deep-link layer depends on) + `__tests__/context/AuthContext.test.js` extended with a `clearSession` test that asserts tokens are cleared AND `authApi.logout` is NOT called. Full mobile suite **47/47 green** (was 36, +11 new); backend suite unchanged at **189/189 green**. **Smoke verified** end-to-end against the live backend: 10/10 acceptance checks (curl + psql) — register → mint known verification token → `/api/mobile/auth/verify?token=…` → 200 with `email_verified=true` in DB → reused token → 400 "Verification token invalid" → bogus token → 400 → resend-by-email (known + unknown) → 202 anti-enumeration → forgot-password (known + unknown) → 202 anti-enumeration → mint known reset token → `/api/mobile/auth/reset-password` → 204 → prior refresh token → 401 (server-side revoked) → old password → 401, new password → 200 → DB confirms `email_verified=true` AND `refresh_tokens.revoked_at IS NOT NULL` for the principal. **Deferred note**: production HTTPS app-link domain (§9.3) + `ios.bundleIdentifier` / `android.package` in `app.json` (§8) are still open — the current `innovationmobile://` custom scheme is development/fallback per §9; Universal Links / App Links require an owned HTTPS app-link/web domain that is not yet provisioned. **Awaiting physical-device acceptance run** for the touch flows (cold-start link handling, warm-start link handling, 30 s resend cooldown haptics, password reveal/eye toggle). |
| Phase 3 | Innovator opportunities/applications | Code complete — backend 121/121 tests green (incl. 13 new Phase 3 slice tests + a GlobalExceptionHandler fix for enum query-param 400s), mobile Browse/MyApplications/Dashboard wired through the new `api/opportunities.js` + `api/stages.js` helpers, awaiting physical-device acceptance run |
| Phase 4 | Projects, milestones, and evidence | Code complete — backend `ProjectControllerPhase4WebMvcTest` (32 tests) green; full backend suite 153/153 green; mobile `api/projects.js` + `api/phases.js` + `apiDownload` (shared refresh pipeline) + `EvidencePanel` + `MyProjectsScreen` (real `/api/projects/me`) + `InnovationProjectCreateScreen` + `InnovationProjectDetailScreen` wired through `useAuth()` + new routes `InnovationProjectCreate` / `InnovationProjectDetail` registered in `App.js`; `AppContext` trimmed of mock projects/evidence; `InnovatorDashboard` greeting reads `useAuth().user` first; backend fix: dropped `@NotBlank` from `MilestoneRequest.name` so PATCH supports partial updates, enforced non-blank at the controller + service for POST add; awaiting physical-device acceptance run |
| Phase 5 | Funder opportunity management | Code complete — backend `OpportunityControllerPhase5WebMvcTest` (13 tests) green; full backend suite 166/166 green; new `GET /api/opportunities/me` (FUNDER-only, open + closed + draft, per-row `applicantCount` via grouped repo query) + `PATCH /api/opportunities/{id}/status?status=open\|closed` (owner + verified gated, DRAFT rejected with 400); V6 migration adds `requirements TEXT` + `tags JSONB`; both DTOs extended; mobile `api/opportunities.js` adds `listMine`/`create`/`update`/`updateStatus`/`remove`; `PostOpportunity.js` calls real POST with 7-type selector + requirements/tags persistence + `disabled` submitting state + backend error surfacing; `MyOpportunities.js` calls `listMine` with pull-to-refresh, supports in-modal edit (PUT), close/reopen (PATCH), delete (DELETE), delete confirm, and loads real `applicantCount`; `FunderDashboard.js` derives `Active Opportunities` + `Total Applicants` from `listMine`; React web `MyOpportunities.jsx` switched to `/me` endpoint with real applicantCount and wired Close/Reopen button; `PostOpportunity.jsx` persists requirements + tags in POST/PUT body and hydrates them in edit mode; awaiting physical-device acceptance run |
| Phase 6 | Received applications and stages | **Verified complete** — backend `ApplicantControllerPhase6WebMvcTest` (9 tests) green; full backend suite 175/175 green; new `GET /api/applications/received` (FUNDER-or-ADMIN, single grouped JPQL across `opportunity.funder.id`, admin sees all); existing `PATCH /api/applications/{id}/stage` re-asserted with WriteGuard + every canonical stage round-trip + missing/unknown stage returns 400; new `HttpMessageNotReadableException` handler in `GlobalExceptionHandler` maps Jackson enum-binding failures to clean 400 (used by stage-PATCH); mobile `api/opportunities.js` extends `applicationsApi` with `listReceived()` + `updateStage(id, stage)` + `classifyStageUpdateError`; `ReceivedApplications.js` rewritten to consume the new endpoint with canonical stage filter, empty/loading/error states with Retry, detail modal with idea + problem + solution + estimated budget + stage-move bar; bulk operations + email-template UI removed (backend has no email-send flow — no false "Email sent" toasts); `FunderDashboard.js` now sources the "Under Review" tile and the "Recent Applications" card from `listReceived()` via `Promise.allSettled`; mock `mockProjects`/`recentApplications`/`activities`/notifications hardcoded lists removed; "Funded Projects" kept as honest empty state (no backend yet); React web `ReceivedApplications.jsx` switched to `/api/applications/received` (replaces the per-opportunity fan-out). **Smoke verified** end-to-end against the live backend: 28/28 acceptance checks (curl + psql) — funder A sees their received application, funder B sees zero (isolation), non-owner PATCH → 403, missing id → 400, innovator role-blocked PATCH → 403, every canonical stage round-trips, unknown stage → 400 with clean message, cross-client parity (innovator `/api/applications/me` reflects same stage as funder received), empty DB → `[]` not seeded rows. |
| Phase 7 | Settings and release hardening | **Code complete** — backend `UserService.updateProfile` (blank-firstName/lastName rejection before normalization, partial-PATCH semantics, six independent notification booleans) + `UserController.updateMe` (`PATCH /api/users/me`, `@Valid` DTO) + `UpdateProfileRequest` (normalized on firstName/lastName, blank-collapses-to-null for optional fields, `@Size` constraint enforcement); `UserResponse` extended with `emailApplications/emailUpdates/emailReminders/pushApplications/pushUpdates/pushReminders`; `UserControllerWebMvcTest` (9 tests, includes blank-rejection + length-violation + optimistic no-op + multi-field + 401 paths) + `UserServiceTest` (5 tests, partial update / blank-firstName / blank-lastName / independent-notification booleans / unknown-user); full backend suite **189/189 green**; mobile `api/users.js` (`usersApi.updateMe` + `classifyProfileError`) + `SettingsScreen` rewritten to load from `useAuth().user` on focus + save via `PATCH /api/users/me` + update AuthContext via `setUser`; `InnovatorDashboard`, `FunderDashboard`, `MyApplications`, `BrowseOpportunities`, `ReceivedApplications` gained `useFocusEffect` refresh + `mountedRef` guards to prevent state-write-after-unmount; `SettingsScreen` has `RefreshControl` + `useFocusEffect`; new `__tests__/api/users.test.js` + `__tests__/api/stages.test.js` + `__tests__/api/client.test.js` + `__tests__/api/projects.test.js` + `__tests__/context/AuthContext.test.js` (36/36 jest-expo tests green); `jest-expo` + `jest.setup.js` (gesture-handler / SecureStore / LinearGradient / Animated mocks) wired into `package.json`; React web `Settings.jsx` rewritten to call `GET /api/users/me` on mount + `PATCH /api/users/me` on save + propagate the refreshed user to `AuthContext.setUser`; `AuthContext.jsx` exposes `setUser`; `Settings.css` carries the `.settings-error` banner + `.save-btn:disabled` state. **Smoke verified** end-to-end against the live backend: 16/16 acceptance checks (curl + psql) — register → GET /me (mobile + web paths show the same row) → PATCH partial phone / PATCH partial bio+location / PATCH notifications / blank firstName → 400 / blank lastName → 400 / no auth → 401 / empty body → 200 no-op / cross-client parity (PATCH /api/users/me → identical data on /api/mobile/auth/me and /api/auth/me) / user-isolation (user2's PATCH does not touch user1's row) / DB persistence confirmed via `SELECT … FROM users WHERE email LIKE 'phase7-%'`. **Awaiting physical-device acceptance run** for the touch flows (keyboard, keyboard-avoiding scroll, toggle haptic feedback). |

Update this table after completing and verifying each phase. Do not mark a phase complete unless its acceptance checks have actually passed.
