# Innovation Tracking — Backend Implementation Plan

> **Status:** Foundation complete (Spring Boot 3.5.16 + Java 17 + PostgreSQL `innovation` DB + Maven). Plan derived from analysis of the existing React frontend in `../Innovation/src/`.
>
> **Goal:** Build a Spring Boot REST API that replaces the frontend's current mock/localStorage data with a real backend, while staying compatible with the existing UI.
>
> **Pace:** Step-by-step. Each phase ends in a runnable, testable state.
>
> **Workflow:** **PARALLEL front-end + back-end.** After every backend phase a small, targeted frontend patch is applied so the user can test the new feature in the React UI immediately. This avoids a giant frontend rewrite at the end and catches API mismatches early. See §9 for the workflow details.

---

## 0. Tech Stack (locked-in)

| Layer | Choice |
|---|---|
| Framework | Spring Boot 3.5.16 |
| Language | Java 17 (running on JDK 21 per project metadata) |
| Build | Maven |
| DB | PostgreSQL `innovation` on `localhost:5432` |
| ORM | Spring Data JPA + Hibernate |
| Auth | Spring Security + jjwt 0.12.x (HS512) |
| Password hashing | BCrypt (built into Spring Security) |
| Validation | Jakarta Bean Validation (`@Valid`, `@NotBlank`, etc.) |
| Frontend (existing) | React 18 + react-router-dom v6 + Context API — currently 100% mock data |

---

## 1. Domain Summary (from React frontend audit)

The frontend has **two parallel product surfaces** sharing one `/login`:

### Surface A — Innovation tracking (4 user roles)
1. **innovator** — browses opportunities, applies, manages own projects
2. **funder** — posts opportunities, reviews applicants, advances stages
3. **admin** — approves funders, manages users & opportunities, sees stats
4. *(public visitors)* — read-only access to `/`, `/opportunities`, `/opportunities/:id`

### Surface B — Innovation Club (uni branches, 2 more user roles)
5. **club-member** (student, staff, alumni, corporate) — branches, projects, treasury, meetings, elections, IP, discipline
6. **club-leader** — verifies members, opens elections, approves transactions, files complaints, etc.

### Auth unification
- Single `/login` page serves all 5 roles (admin/club redirect to it).
- One `AuthContext` for users A.1–A.3 + public visitors.
- A separate `ClubContext` for users B.1 + B.2.
- Backend should expose **two auth endpoints** (or one unified with `surface=innovation|club`).

### Token storage
- Frontend has placeholder `localStorage.removeItem("token")` calls but never sets the token.
- Backend must return a JWT; frontend will be patched in a later phase to read & store it.

---

## 2. Roles & Authorization Matrix

| Role | Routes (frontend) | Backend authority |
|---|---|---|
| `INNOVATOR` | `/dashboard/innovator/*` | own projects, apply to opportunities |
| `FUNDER` | `/dashboard/funder/*` | own opportunities, manage applicants |
| `ADMIN` | `/admin/*` | full CRUD on users, orgs, opportunities; stats |
| `CLUB_MEMBER` | `/club/member/*`, `/club/pending`, public branch views | branch-scoped reads/writes per their branch |
| `CLUB_LEADER` | `/club/leader/*` | same as member + approve, verify, open elections, treasury approvals |
| Public | `/`, `/opportunities/*`, `/club/branches/*` | read-only public endpoints |

> **Note:** Roles are persisted as **uppercase enum constants** in DB (`INNOVATOR`, `FUNDER`, `ADMIN`, `CLUB_MEMBER`, `CLUB_LEADER`) but serialized as **lowercase strings** in JSON / JWT (`"innovator"`, `"funder"`, `"admin"`, `"club-member"`, `"club-leader"`) to match `AuthContext.ROLE_HOME`. This single contract is used by both `/api/auth/*` and `/api/club/auth/*` so the frontend's role checks keep working unchanged.

---

## 3. Entity Inventory (ground truth from frontend mocks + clubSeed)

### 3.1 Innovation surface

| Entity | Key fields | Source page |
|---|---|---|
| **User** | id, email, passwordHash, firstName, lastName, name, **role** (`INNOVATOR` \| `FUNDER` \| `ADMIN`), sector?, phone?, bio?, location?, status, notificationPrefs, createdAt | AuthContext, Settings |

### 3.4 Auth users (re-stating roles explicitly)

The backend will have **5 distinct role values**, persisted as strings in DB and matched exactly by `SimpleGrantedAuthority`. To avoid the casing mismatch seen in the frontend (`"admin"` vs `"Admin"`), we pick **one casing and stick to it** in both DB and frontend payloads.

| Enum value (DB) | Lowercase (JSON / frontend contract) | Where used |
|---|---|---|
| `INNOVATOR` | `"innovator"` | Self-registered via `/api/auth/register` |
| `FUNDER` | `"funder"` | Self-registered via `/api/auth/register` (sector required) |
| `ADMIN` | `"admin"` | **Seeded only** — not self-registered |
| `CLUB_MEMBER` | `"club-member"` | Self-registered via `/api/club/auth/register` (4 categories) |
| `CLUB_LEADER` | `"club-leader"` | **Seeded only** — not self-registered |

Two separate `Role` enums are used in code to keep domains explicit:
- `com.example.Innovation_backend.user.Role` — `INNOVATOR`, `FUNDER`, `ADMIN`
- `com.example.Innovation_backend.club.ClubRole` — `CLUB_MEMBER`, `CLUB_LEADER`

Each enum serializes to lowercase string in JSON. JWT claims use the same lowercase form so the frontend's existing `user.role === "innovator"` checks keep working unchanged.

> ⚠️ **Read this carefully** — this answers your question:
> - **`INNOVATOR`, `FUNDER`, `ADMIN`** belong to the *Innovation* surface (`User` entity)
> - **`CLUB_MEMBER`, `CLUB_LEADER`** belong to the *Club* surface (`ClubMember` + `ClubLeader` entities — separate tables, separate auth endpoints)
>
> They are **never mixed** in a single table. Two enums in code; lowercase JSON; one consistent contract.
| **Opportunity** | id, title, type, description, amount, deadline, location, requirements[], tags[], category, eligibility, status, funderId, applicationsCount, postedDate, applicants[] | PublicOpportunities, PostOpportunity |
| **Application** | id, opportunityId, innovatorId, ideaTitle, problemStatement, proposedSolution, estimatedBudget, stage, appliedAt | MyApplication, ReceivedApplications |
| **InnovatorProject** | id, ownerId, zsaId, name, category, phase, completedMilestones[], milestoneDates, description | MyProjects |
| **Organization** | id, name, email, location, type, status, submittedDate | AdminOrganizations |

### 3.2 Club surface

The club domain has ~30 entities. We will implement them in waves — **not all at once**.

**Core (Phase 4):**
- **Club** (a.k.a. Branch / Tawi) — id, name, universityId, patronId, campus, address, foundedAt, status, charterSignedAt, memberCount
- **ClubMember** — id, fullName, email, passwordHash, universityId, category, regNumber?, staffId?, graduationYear?, organizationName?, organizationRole?, bio?, status (pending/active/suspended/expelled/withdrawn/rejected), registeredAt, verifiedBy, verifiedAt, clubId, skills[]
- **ClubLeader** — id, fullName, email, passwordHash, universityId, role (Mlezi/KamatiTendaji), phone
- **University** *(read-only seed)* — id, name, shortName, regNumberPrefix, primaryColor, tagline (4 rows: SUZA, ZU, SUMAIT, KIST)

**Extended (later phases — out of MVP scope unless requested):**
- ClubProject, Executive, HandoverLog, Election, Ballot, ElectionCommittee, Meeting, Attendance, Minutes, Decision, Wallet, Transaction, Budget, Dues, AuditLog, CodeOfConductSignature, Conflict, IPRegistry, DisciplinaryCase, Amendment, Dissolution, OnboardingPlan

### 3.3 Static config (seeded once, read-only)

- Universities (4)
- Member categories (4) — student/staff/alumni/corporate
- Membership statuses (6) — pending/active/suspended/expelled/withdrawn/rejected
- Executive positions (7), meeting types (4), wallet types (3), income categories (4), expense categories (6), IP types (5), sanction levels (5)
- Constitution articles (48 in 12 chapters, Kiswahili + English) — **hold for later**

---

## 4. REST API Surface

### 4.1 Auth (Phase 2)

```
POST   /api/auth/register       { email, password, role, firstName, lastName, sector? }  → 201 { token, user }
POST   /api/auth/login          { email, password }                                     → 200 { token, user }
GET    /api/auth/me             (Bearer token)                                          → 200 { user }
```

### 4.2 Users (Phase 3)

```
GET    /api/users/me            (auth)
PUT    /api/users/me            (auth)  — update profile & notificationPrefs
PUT    /api/users/me/password   (auth)  — change password
GET    /api/admin/users         (admin)
PUT    /api/admin/users/{id}    (admin)
DELETE /api/admin/users/{id}    (admin)
PATCH  /api/admin/users/{id}/status  (admin)
GET    /api/admin/stats         (admin)
```

### 4.3 Opportunities & Applications (Phase 3)

```
GET    /api/opportunities                       (public)   ?status=open&search=&type=
GET    /api/opportunities/{id}                  (public)
POST   /api/opportunities                       (funder)
PUT    /api/opportunities/{id}                  (funder, owner)
DELETE /api/opportunities/{id}                  (funder, owner | admin)
GET    /api/opportunities/{id}/applicants       (funder, owner | admin)
POST   /api/opportunities/{id}/apply            (innovator)  { ideaTitle, problemStatement, proposedSolution, estimatedBudget }
PATCH  /api/applications/{id}/stage             (funder, opportunity-owner | admin)  { stage }
GET    /api/applications/me                     (innovator)
GET    /api/admin/opportunities                 (admin)
```

### 4.4 Innovator Projects (Phase 3)

```
GET    /api/projects/me                  (innovator)
POST   /api/projects                     (innovator)
PUT    /api/projects/{id}                (innovator, owner)
DELETE /api/projects/{id}                (innovator, owner)
PATCH  /api/projects/{id}/milestones     (innovator, owner)  — toggle/complete milestones
PATCH  /api/projects/{id}/phase          (innovator, owner)
```

### 4.5 Organizations (Phase 3)

```
GET    /api/admin/organizations
PATCH  /api/admin/organizations/{id}/status     { status }   (admin) — approve/reject
```

### 4.6 Club Auth & Members (Phase 4)

```
POST   /api/club/auth/register         (public) { ...memberFields, category }        → 201 { token, member }
POST   /api/club/auth/login            (public) { email, password }                  → 200 { token, leader | member, role }
GET    /api/club/auth/me               (auth)

GET    /api/club/branches              (public)                  list all active branches
GET    /api/club/branches/{id}         (public)                  branch detail
GET    /api/club/branches/{id}/members (member | leader | admin) directory
PATCH  /api/club/members/{id}/status   (leader | admin)          approve/reject/suspend/expel/withdraw
```

### 4.7 Club extended (later phases)

> Will be added only after core is stable. See §6 for sequencing.

---

## 5. Project Structure

```
Innovation_backend/
├── pom.xml
├── mvnw, mvnw.cmd
├── IMPLEMENTATION_PLAN.md                 ← this file
├── src/main/java/com/example/Innovation_backend/
│   ├── InnovationBackendApplication.java  ← entry point (already exists)
│   ├── config/
│   │   ├── SecurityConfig.java            ← filter chain, CORS, public/protected routes
│   │   ├── CorsConfig.java
│   │   └── JpaConfig.java                 ← optional (auditing, naming)
│   ├── security/
│   │   ├── JwtService.java                ← issue/validate HS512 tokens
│   │   ├── JwtAuthFilter.java             ← OncePerRequestFilter that reads Authorization header
│   │   └── CustomUserDetailsService.java  ← load by email for Spring Security
│   ├── auth/                              ← login/register surface
│   │   ├── AuthController.java
│   │   ├── AuthService.java
│   │   └── dto/ (LoginRequest, RegisterRequest, AuthResponse)
│   ├── user/                              ← User entity + admin endpoints
│   │   ├── User.java
│   │   ├── Role.java                      ← enum: INNOVATOR | FUNDER | ADMIN
│   │   ├── UserRepository.java
│   │   ├── UserService.java
│   │   ├── UserController.java
│   │   └── dto/
│   ├── opportunity/
│   │   ├── Opportunity.java
│   │   ├── OpportunityType.java / OpportunityStatus.java
│   │   ├── OpportunityRepository.java
│   │   ├── OpportunityService.java
│   │   └── OpportunityController.java
│   ├── application/
│   │   ├── Application.java
│   │   ├── ApplicationStage.java
│   │   ├── ApplicationRepository.java
│   │   ├── ApplicationService.java
│   │   └── ApplicationController.java
│   ├── project/                            ← innovator projects
│   │   ├── InnovatorProject.java
│   │   ├── ProjectPhase.java
│   │   ├── ProjectRepository.java
│   │   ├── ProjectService.java
│   │   └── ProjectController.java
│   ├── organization/
│   │   ├── Organization.java
│   │   ├── OrganizationStatus.java
│   │   └── (repo, service, controller)
│   ├── club/
│   │   ├── University.java + repository
│   │   ├── Club.java + repository (a.k.a. Branch)
│   │   ├── ClubMember.java + repository
│   │   ├── ClubLeader.java + repository
│   │   ├── Category.java + MembershipStatus.java (enums)
│   │   ├── ClubAuthController.java
│   │   ├── ClubMemberController.java
│   │   └── ClubController.java
│   └── common/
│       ├── ApiError.java
│       ├── GlobalExceptionHandler.java    ← @ControllerAdvice
│       └── DataSeedRunner.java            ← CommandLineRunner: seed universities, admin user
├── src/main/resources/
│   ├── application.properties             ← already done
│   └── db/migration/                      ← Flyway (optional; deferred)
└── src/test/java/com/example/Innovation_backend/
    └── (smoke tests as we go)
```

---

## 6. Phased Build Plan (parallel: backend + frontend)

Each phase has **two halves**:
1. **Backend** — Spring Boot files in this repo (`Innovation_backend/`)
2. **Frontend patch** — small React changes in `../Innovation/` so the new feature is testable from the UI immediately

Each phase ends in a fully testable state. We pause after each for your review before moving on.

### ✅ Phase 0 — Foundation (DONE)
- [x] Project generated on [start.spring.io](https://start.spring.io) with: web, jpa, security, validation, postgresql, lombok, devtools
- [x] `application.properties` configured for PostgreSQL `innovation`
- [x] DB connection verified (Hikari `Start completed`, no `PSQLException`)
- [x] Tomcat starts on port 8080

### 🟡 Phase 1 — Security baseline (DONE)
- [x] Package folders: `config/`, `security/`, `common/`, `health/`
- [x] `JwtService`, `JwtAuthFilter`, `RestAuthenticationEntryPoint`
- [x] `SecurityConfig`: stateless, CORS for `localhost:5173`, public routes pre-declared
- [x] `GlobalExceptionHandler` → uniform JSON errors
- [x] `GET /api/health` → `{"status":"UP"}`
- [x] **Frontend:** no changes needed

### 🟢 Phase 2 — Innovation Auth (register / login / me) (DONE)
**Backend:**
- [x] `user/` package: `User` entity, `Role` enum (`INNOVATOR`/`FUNDER`/`ADMIN`), `UserRepository`, `UserService`, `UserController`, `UserDetailsServiceImpl`, DTOs (`RegisterRequest`, `LoginRequest`, `UserResponse`)
- [x] `auth/` package: `AuthController`, `AuthService`, `AuthResponse`
- [x] `POST /api/auth/register` — bean validation, rejects `role=ADMIN`, BCrypt hashing
- [x] `POST /api/auth/login` — returns `{ token, user }`
- [x] `GET /api/auth/me` and `GET /api/users/me`
- [x] `JpaAuditingConfig` for `@CreatedDate`
- [x] `DataSeedRunner` seeds `admin@innovation.local / Admin123!`

**Frontend patch (applied):**
- [x] `src/api/client.js` — fetch wrapper with JWT injection in localStorage under key `"token"`
- [x] `src/context/AuthContext.jsx` — `login`/`register` are now `async`, hit `/api/auth/*`, persist token, restore session on mount via `GET /api/auth/me`
- [x] `src/pages/LoginPage.jsx` — `handleSubmit` now `async`, awaits `authLogin`, surfaces backend errors
- [x] `src/pages/RegisterPage.jsx` — same, plus forwards password to backend (was previously ignored)

**Verify (end-to-end from React UI):**
- [x] Login as `admin@innovation.local / Admin123!` → lands on `/admin/dashboard`
- [x] DevTools → Application → Local Storage shows `"token": "eyJ..."`
- [x] Refresh page → still logged in (session restored via `/api/auth/me`)
- [x] Register a new innovator via Register form → lands on `/dashboard/innovator`
- [x] Bad password shows backend error: `"Invalid email or password"`

### 🔵 Phase 3 — Innovation CRUD (role-by-role, dependency-ordered)

> **Why split into 3A → 3B → 3C?** The three roles are interdependent: ADMIN must approve a FUNDER's organization before the funder can post, and an INNOVATOR can only apply once a FUNDER has posted. Doing all of Phase 3 in one shot leaves no clean point to test each role in isolation. The sub-phases below follow the dependency graph so each one ends in a testable state for a specific role.
>
> **Locked decisions for Phase 3:**
> - **Funder gating:** a funder can only `POST /api/opportunities` if they have at least one `Organization` with status `APPROVED`. Otherwise backend returns `403 FORBIDDEN`. Matches the current frontend mock.
> - **Milestone storage:** separate `milestones` table with FK to `innovator_projects` (not a JSONB column). Each milestone is its own row with `name`, `completed`, `completed_date`, `position`. Cleaner for queries/reporting.

#### 🟦 Phase 3A — Innovator Projects + Admin ZSA approval (DONE ✅)
**Backend:**
- [x] `project/` package: `InnovatorProject` entity, `ProjectPhase` enum, repo, service, controller
- [x] `project/Milestone` entity + repository (separate table, FK to project)
- [x] `project/ProjectApprovalStatus` enum + `ZsaIdGenerator` (auto ZSA-INV-{YEAR}-{seq})
- [x] `AdminProjectController` + `AdminProjectService` (approve/reject/override)
- [x] Query-param converters: `ProjectApprovalStatusConverter`, `ProjectPhaseConverter` (so `?status=pending` works)
- [x] Endpoints:
  - `GET    /api/projects/me                       (innovator)`
  - `POST   /api/projects                          (innovator)` — creates project PENDING, no zsaId
  - `PUT    /api/projects/{id}                     (innovator, owner)` — preserves zsaId + approvalStatus
  - `DELETE /api/projects/{id}                     (innovator, owner)`
  - `PATCH  /api/projects/{id}/phase?phase=proposal (innovator, owner)`
  - `POST   /api/projects/{id}/milestones          (innovator, owner)`
  - `PATCH  /api/projects/{id}/milestones/{mid}    (innovator, owner)`
  - `DELETE /api/projects/{id}/milestones/{mid}    (innovator, owner)`
  - `GET    /api/admin/projects?status=pending     (admin)`
  - `PATCH  /api/admin/projects/{id}/approve       (admin)` — auto-assigns ZSA ID
  - `PATCH  /api/admin/projects/{id}/reject        (admin)`
  - `PATCH  /api/admin/projects/{id}/zsa-id        (admin)` — override the assigned ID
- [x] Owner-check on every mutation (404, not 403, to avoid leaking project existence)
- [x] Fixed: `@AuthenticationPrincipal` NPE by reading principal via `SecurityContextHolder`
- [x] Fixed: enum @RequestParam mismatch by registering `Converter` beans

**Frontend patch (backend only, no mock fallback):**
- [x] `src/pages/MyProjects.jsx` → CRUD against `/api/projects/*`
- [x] `src/pages/AdminProjects.jsx` (NEW) → list pending, approve/reject/override
- [x] Empty state + error banner when backend is unreachable (NO mock fallback)

**Verify (end-to-end, all passed ✅):**
- [x] Innovator creates project → 201 with zsaId=null, approvalStatus=pending
- [x] Admin sees the project at /api/admin/projects?status=pending
- [x] Admin approves → project gets ZSA-INV-2026-001, status=approved
- [x] Innovator refresh → sees the new ZSA ID
- [x] Admin tries to approve again → 400 "Project is already approved"
- [x] Admin overrides ZSA ID → 200 with new value
- [x] Innovator advances phase → 200
- [x] Innovator toggles milestone → 200 with completedDate set
- [x] Innovator deletes milestone → 204
- [x] Second innovator GETs first innovator's project → 404

#### 🟦 Phase 3B — Opportunities + Organizations (DONE ✅)
**Backend:**
- [x] `opportunity/` package: `Opportunity` entity, `OpportunityType` + `OpportunityStatus` enums, repo, service, controller
- [x] `organization/` package: `Organization` entity, `OrganizationStatus` enum, repo, service, controller
- [x] Endpoints (public reads + funder writes + admin moderation):
  - `GET    /api/opportunities                              (public) ?status=&search=&type=`
  - `GET    /api/opportunities/{id}                         (public)`
  - `POST   /api/opportunities                              (funder)` — **requires at least one APPROVED Organization; else 403**
  - `PUT    /api/opportunities/{id}                         (funder, owner)`
  - `DELETE /api/opportunities/{id}                         (funder, owner | admin)`
  - `GET    /api/admin/organizations                        (admin)`
  - `PATCH  /api/admin/organizations/{id}/status  { status } (admin)`
  - `GET    /api/admin/organizations/diagnostic             (admin)` — DB debug
  - `GET    /api/admin/organizations/diagnostic/counts      (admin)` — DB debug
- [x] On funder register: auto-create a `PENDING` Organization row (so admins always have something to approve)
- [x] On admin approve: funder gains posting ability immediately
- [x] Top-level `@Component` enum converters (`OpportunityTypeConverter`, `OpportunityStatusConverter`, `OrganizationStatusConverter`) so `?status=open&type=grant` is case-insensitive
- [x] Per-method `@PreAuthorize` + `SecurityContextHolder` (no `@AuthenticationPrincipal` NPE)

**Frontend patch:**
- [x] `src/pages/PublicOpportunities.jsx` → fetch `GET /api/opportunities` (filter by type, search by title)
- [x] `src/pages/PublicOpportunityDetail.jsx` → render real opportunity + Apply button
- [x] `src/pages/PostOpportunity.jsx` → POST + handle 403 ("organization not approved")
- [x] `src/pages/AdminOrganizations.jsx` → list + approve/reject (no mock data)
- [x] `src/api/client.js` — extended with `params` support for query strings

**Verify (end-to-end, all passed ✅):**
- [x] Register a new funder → admin sees a new PENDING organization via diagnostic endpoint
- [x] Admin approves org via `PATCH /api/admin/organizations/{id}/status` → status flips to APPROVED
- [x] Funder (now approved) posts an opportunity via frontend → public list shows it
- [x] Innovator sees the new opportunity on `/opportunities`
- [x] Funder whose org is PENDING tries to POST → gets `403 "Your organization is not approved yet"` (proven via Thunder + frontend toast)

#### 🟦 Phase 3C — Applications (after 3B verified) — DONE ✅
**Backend:**
- [x] `application/` package: `Application` entity, `ApplicationStage` enum, repo, service, controller
- [x] Endpoints:
  - [x] `POST   /api/opportunities/{id}/apply            (innovator)  { ideaTitle, problemStatement, proposedSolution, estimatedBudget }`
  - [x] `GET    /api/applications/me                      (innovator)`
  - [x] `GET    /api/opportunities/{id}/applicants       (funder, owner | admin)`
  - [x] `PATCH  /api/applications/{id}/stage              (funder, opportunity-owner | admin)  { stage }`
- [x] Innovator can apply once per opportunity (unique constraint on `opportunity_id + innovator_id`) — `uk_app_opportunity_innovator`
- [x] Stage moves are **flexible** in 3C (funder can move to any stage). Tighten to linear in a later hardening phase if needed.

**Frontend patch:**
- [x] `src/pages/PublicOpportunityDetail.jsx` → wire Apply button to `POST /api/opportunities/:id/apply`
- [x] `src/pages/MyApplication.jsx` → fetch from `GET /api/applications/me`
- [x] `src/pages/ReceivedApplications.jsx` → fetch `GET /api/opportunities/:id/applicants` + `PATCH /api/applications/:id/stage`
- [x] `src/pages/BrowseOpportunities.jsx` → wire its own Apply modal (was a stub) and surface "✓ Applied" badges

**Verify (end-to-end):**
- [x] Innovator applies to funder's opportunity → funder sees the application
- [x] Funder moves stage `SUBMITTED → UNDER_REVIEW → ACCEPTED` → innovator sees updated stage
- [x] Innovator tries to apply to the same opportunity twice → backend rejects (409)
- [x] Different funder cannot view applicants for an opportunity they don't own (403)

### 🟣 Phase 4 — Club auth & core (members, leaders, branches) ✅ COMPLETE
**Backend:**
- [x] `club/` package: `University`, `Club` (Branch), `ClubMember`, `ClubLeader` entities
- [x] `club/ClubRole` enum (`CLUB_MEMBER`/`CLUB_LEADER`)
- [x] `University` seeded with the 4 hard-coded rows (SUZA, ZU, SUMAIT, KIST)
- [x] `POST /api/club/auth/register` — 4 categories (student/staff/alumni/corporate)
- [x] `POST /api/club/auth/login` → `{ token, role, kind }`
- [x] `GET /api/club/branches`, `/api/club/branches/:id`, `/api/club/branches/:id/members`
- [x] Leader approve/reject endpoints (`PATCH /api/club/members/{id}/status`, gated to leader/admin)
- [x] `POST /api/admin/club-leaders` + `POST /api/admin/clubs` (admin creates leaders + branches — see §6 verify note)

**Frontend patches (applied):**
- [x] `src/club/context/ClubContext.jsx` — added `currentPrincipal`, `loginWithBackend`, `registerMemberWithBackend`, `logoutClubBackend`, hydrate-on-mount effect via `clubApi.me()`. Legacy localStorage state retained for Phase 5+ features.
- [x] `src/club/api/clubApi.js` — already present
- [x] `src/club/api/useClubBackend.js` (NEW) — `useClubBranches` + `useClubMembers` hooks
- [x] `src/club/pages/ClubLogin.jsx` — calls `loginWithBackend` instead of localStorage
- [x] `src/club/pages/ClubRegister.jsx` — calls `registerMemberWithBackend` instead of localStorage
- [x] `src/pages/AuthPage.jsx` — unified `/login` falls through to `loginWithBackend` on innovation 401; club-role register uses `registerMemberWithBackend`
- [x] `src/club/pages/ClubBranches.jsx` — reads branches via `useClubBranches`
- [x] `src/club/pages/ClubBranchDetail.jsx` — reads branch + members via `useClubBranches`/`useClubMembers`
- [x] `src/club/pages/ClubLeaderDashboard.jsx` — derives pending/decided lists from backend members; uses `currentPrincipal.kind === 'LEADER'`
- [x] `src/club/pages/ClubMemberDashboard.jsx` — uses `currentPrincipal.kind === 'MEMBER'`; verifies via backend `me.status`

**Verify (end-to-end):**
- [x] Leader login via `/login` lands on `/club/leader/dashboard` (backend 200 on `/api/club/auth/login`)
- [x] Thunder: `POST /api/club/auth/register` (student) returns 201 with `status: PENDING`
- [x] Leader approve via `PATCH /api/club/members/{id}/status` body `{"status":"ACTIVE"}` returns 200
- [x] Member login + dashboard render (verify after refresh — `me.status === 'active'`)
- [x] Branches list renders from backend (`GET /api/club/branches` 200)
- [x] Branch detail + members render from backend (`GET /api/club/branches/:id/members` 200)

> **Notes for future phases:**
> 1. Admin creates leaders via `POST /api/admin/club-leaders` (not seeded — DataSeedRunner only seeds universities).
> 2. Club project listing on member dashboard is **deferred to Phase 5** — Phase 4 scope is identity only.
> 3. Legacy localStorage state in `ClubContext` (`students`, `clubLeaders`, `clubs`, …) is retained for the upcoming Phase 5 features (elections, treasury, discipline) that have no backend equivalents yet. The auth-aware surfaces (login, register, dashboards, branches list, branch detail) all read from the backend.

### 🟠 Phase 5 — Club extended (deferred — only on request)
Elections, meetings, treasury, IP, discipline, amendments, dissolutions, onboarding.
> **Each is its own sub-phase** because of the state machines and rules. Will batch only after core is stable.

#### ✅ Phase 5A — Club Projects (live, university-scoped)
- [x] `ClubProject` entity (FK to `ClubMember` + `Club`, reuses `ProjectPhase`, `@ElementCollection` tags, audit dates)
- [x] `ClubProjectRepository` — `findAllByAuthorIdOrderByCreatedAtDesc`, `findAllByClubIdOrderByCreatedAtDesc`
- [x] DTOs — `ClubProjectRequest` (bean validation) + `ClubProjectResponse` (record, `from(ClubProject)`)
- [x] `ClubProjectService` — create (ACTIVE-gated), listMine, listForBranch (auth + same-university), delete (owner-only → 404); helper `requireSameUniversityOrAdmin()` for cross-uni guards (404 not 403)
- [x] `ClubProjectController` — 4 endpoints with `@PreAuthorize` on the public branch feed too
- [x] `ClubBranchService` — `listActiveForCaller` / `getOneForCaller` filter to caller's university (ADMIN bypass); `CallerScope` helper resolves member or leader by email
- [x] `ClubBranchController` — `@PreAuthorize` on list + getOne; `/members` already gated
- [x] `SecurityConfig` — `permitAll` removed for `/api/club/branches`, `/api/club/branches/*`, and `/api/club/branches/*/projects` (was a federation-wide privacy leak; now auth-required and university-scoped)
- [x] Frontend — `clubApi` gains `createProject/myProjects/deleteProject/branchProjects`; `ClubCreateProject` posts to backend (PENDING → 403 surfaced inline); `ClubMemberDashboard` "My Projects" card hydrates from `GET /api/club/projects/me`; `ClubBranchDetail` shows the live project feed; `ClubBranches` redirects anonymous visitors to login and shows a friendly "session expired" hint on auth errors
- [x] **Scope decision** — branches + their projects are **only visible to members/leaders of the same university** (admins see the federation). Cross-university access returns 404, not 403, so existence isn't leaked.

#### ✅ Phase 5B-2 — Club Activities & Announcements (live)

Built on 2026-07-24 after the Phase 5B removal left a hole in the leader's MVP. Mirrors the Phase 5A pattern: one entity per concept, same-university access (404 on cross-uni reads), ACTIVE-status gating for registration.

**Backend — new packages `club.activity` and `club.announcement`:**
- [x] `ClubActivity` entity (FK to `Club` + `ClubLeader`, type/status enums, audit dates, capacity, isOnline + meetingUrl)
- [x] `ClubActivityType` enum: `WORKSHOP` / `TRAINING` / `PITCH_PRACTICE` / `DEMO_DAY` / `MEETING` / `OTHER`
- [x] `ClubActivityStatus` enum: `SCHEDULED` / `CANCELLED` / `COMPLETED`
- [x] `ClubActivityRegistration` entity (member ↔ activity signup; unique constraint)
- [x] `ClubActivityRegistrationRepository` + `ClubActivityRepository`
- [x] DTOs — `ActivityRequest` (bean validation), `ActivityResponse.from(activity, count, isCurrentUserRegistered)`, `RegistrationResponse`
- [x] `ClubActivityService` — create/update/delete (organizer or admin), listForBranch/getOne (same-university auth), register/unregister (ACTIVE member at same branch; capacity + status + duplicate checks)
- [x] `ClubActivityController` — 8 endpoints:
  - `POST /api/club/branches/{id}/activities` (leader | admin)
  - `GET /api/club/branches/{id}/activities` (member | leader | admin)
  - `GET /api/club/activities/{id}`
  - `PATCH /api/club/activities/{id}` (organizer | admin)
  - `DELETE /api/club/activities/{id}` (organizer | admin)
  - `POST /api/club/activities/{id}/register` (member, ACTIVE)
  - `DELETE /api/club/activities/{id}/register` (member, ACTIVE)
  - `GET /api/club/activities/{id}/registrations` (organizer | admin)
- [x] `ClubAnnouncement` entity (FK to `Club` + `ClubLeader`, pinned flag, audit dates)
- [x] `ClubAnnouncementRepository` — `findAllByClubIdOrderByPinnedDescCreatedAtDesc`
- [x] DTOs — `AnnouncementRequest`, `AnnouncementResponse`
- [x] `ClubAnnouncementService` + `ClubAnnouncementController` — 5 endpoints:
  - `POST /api/club/branches/{id}/announcements` (leader | admin)
  - `GET /api/club/branches/{id}/announcements` (member | leader | admin)
  - `GET /api/club/announcements/{id}`
  - `PATCH /api/club/announcements/{id}` (author | admin)
  - `DELETE /api/club/announcements/{id}` (author | admin)
- [x] `ClubAccessChecks` extracted from `ClubProjectService` into a shared `@Component` helper (`currentMember()`, `currentLeader()`, `requireSameUniversityOrAdmin(Club)`). Both `ClubProjectService` and `ClubActivityService` use it. No behavior change for existing project endpoints.

**Frontend — new pages + API extensions:**
- [x] `clubApi.js` — extended with 14 new methods (`listActivities`, `createActivity`, `getActivity`, `updateActivity`, `deleteActivity`, `registerForActivity`, `unregisterFromActivity`, `listActivityRegistrations`, `listAnnouncements`, `createAnnouncement`, `getAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`)
- [x] `useClubBackend.js` — added `useClubActivities(branchId)` and `useClubAnnouncements(branchId)` hooks
- [x] `ClubActivities.jsx` — browse + filter + register/unregister (members) + create button (leaders)
- [x] `ClubActivityDetail.jsx` — full detail with leader-only edit/delete + roster view for the organizer
- [x] `ClubCreateActivity.jsx` / `ClubEditActivity.jsx` — shared `ActivityForm` with leader gate
- [x] `ClubAnnouncements.jsx` — feed (pinned-first) with leader create/edit/delete
- [x] `ClubCreateAnnouncement.jsx` / `ClubEditAnnouncement.jsx` — shared `AnnouncementForm`
- [x] `ClubSidebar.jsx` — Activities + Announcements links + icons
- [x] `App.jsx` — 7 new routes (4 activities + 3 announcements), wrapped with `ClubRouteGuard role="leader"` for create/edit

**Verify (end-to-end, all passed ✅):**
- [x] Leader login → `POST /api/club/branches/1/activities` with `{title, type:WORKSHOP, startAt, endAt, ...}` → 201 with id
- [x] Leader `GET /api/club/branches/1/activities` → list with `registrationCount` and `isCurrentUserRegistered` per item
- [x] Member (PENDING) `POST /api/club/activities/1/register` → 403
- [x] Member (ACTIVE, same branch) same call → 201 with `RegistrationResponse`
- [x] `isCurrentUserRegistered` flips to true on subsequent GET
- [x] Member from a different university `GET /api/club/activities/1` → 404 (privacy pattern)
- [x] Cross-uni leader `POST /api/club/branches/{otherBranchId}/activities` → 403
- [x] Leader `DELETE /api/club/activities/1` → 204; rows in `club_activity_registrations` cascade-delete
- [x] Same flow for announcements: leader posts → member reads → leader edits → admin can delete anything
- [x] `mvn clean compile` → BUILD SUCCESS
- [x] `npx vite build` → ✅ 102 modules, no errors

**Scope decision** — activities + announcements are strictly university-scoped (404 on cross-uni reads). Same privacy pattern as Phase 5A.

#### ⛔ Phase 5B — REMOVED 2026-07-24

The following sub-phases were scoped and (for Elections) partially built, but the user decided they are **not important enough to keep in the system** and removed both backend and frontend code on 2026-07-24. Phase 5A (Club Projects) is the only live piece of "extended club work". Reason: out of MVP scope — the system already covers innovation flow + club identity + club projects + read-only executive committee + constitution/conduct/conflict/IP. Governance workflows beyond that were not on the critical path.

| Sub-phase | Backend status at removal | Frontend status at removal |
|---|---|---|
| Elections (Phase 5B-1) | ✅ Built (compiling, never deployed) | localStorage pages deleted |
| Meetings | Not built | localStorage pages deleted |
| Treasury | Not built | localStorage pages deleted |
| Discipline | Not built | localStorage pages deleted |
| Amendments | Not built | localStorage pages deleted |
| Dissolution | Not built | localStorage pages deleted |
| Onboarding | Not built | localStorage pages deleted |
| Handover | Not built | localStorage pages + ClubContext selectors deleted |

**What was removed:**
- Backend: the entire `club/election/` package (36 files: entities, repos, services, two controllers, DTOs) + 3 election-related exception handlers in `GlobalExceptionHandler`.
- Frontend: 26 page files in `src/club/pages/`, 3 data files (`data/elections.js`, `data/meetings.js`, `data/treasury.js`), and partial prune of `data/constitution.js`. ~1,622 lines deleted from `ClubContext.jsx` (selector functions + duplicate value-object entries); import surface collapsed. Sidebar collapsed to: Dashboard / All Branches / My Committee / Code of Conduct / Constitution.
- Database: 7 Hibernate-managed tables (`club_elections`, `club_nominations`, `club_ballots`, `club_election_results`, `club_election_committees`, `club_election_complaints`, `club_executives`). A manual SQL DROP script was provided — see the commit message on 2026-07-24.

**What was deliberately kept as read-only:**
- `executives` state, `executivesForBranch`, `executiveForPosition`, `memberForExecutive`, `executivePositions` — used by `ClubExecutiveCommittee.jsx`, `ClubPositionDuties.jsx`, `ClubPatron.jsx`. Becomes read-only; no UI to appoint or remove executives.
- `appointExecutive`, `removeExecutive` selectors stay defined but no UI invokes them after the removal.
- `data/constitution.js` keeps `CONSTITUTION_META`, `IBARA_LIST`, `SURA_LIST` for `ClubConstitution.jsx`. `AMENDMENT_RULES`, `DISSOLUTION_RULES`, `ONBOARDING_STEPS` exports deleted (orphaned).
- Constitution / Code of Conduct / Conflict Disclosure / IP Registry pages (and their state) all kept — they're static-data or have a kept-product story.

> **Re-introducing these:** If any sub-phase needs to come back later, Phase 5B-1 (Elections) is the only one that has the design + state-machine diagrams archived in git history. The other sub-phases were never built, so adding them means starting from the §3.2 entity inventory. The frontend `clubSeed.js` `SEEDED_FLAG` was bumped to `v4` to drop deleted keys from returning users' localStorage.

#### ⛔ Phase 5B-1 — Elections backend (REMOVED 2026-07-24 — was here, now gone)
**Backend (was here):**
- [x] `election/` package — entities, repos, services, two controllers, DTOs (DELETED 2026-07-24)
- [x] `ClubElectionService` + `ClubExecutiveService` (DELETED)
- [x] Secret-ballot guarantee at the repository boundary (DELETED)
- [x] Same-university 404 pattern (preserved in remaining code via `ClubProjectService`)

**Removed because:** the user determined elections / executive appointment flows are out of MVP scope. The system retains read-only executive committee display via the kept `executives` state in `ClubContext.jsx`.

### 🟣 Phase 6 — Hardening

#### ✅ Phase 6A — Refresh tokens (DONE 2026-07-24)
**Backend:**
- [x] `V3__refresh_tokens.sql` Flyway migration — `refresh_tokens` table with `surface`, `user_id`, `family_id`, `token_hash` (SHA-256, unique), `expires_at`, `created_at`, `revoked_at`, `replaced_by_id`. Indexed on `(surface, user_id)`, `family_id`, `expires_at`.
- [x] `auth/RefreshToken.java` entity + `RefreshTokenRepository` (incl. `revokeFamily` for reuse-detection)
- [x] `auth/RefreshTokenService` — `issue / rotate / revoke`. Raw token format: 32 random bytes → URL-safe Base64; we never persist the raw value.
- [x] `config/RefreshProperties` — `@ConfigurationProperties("app.refresh")` for access TTL (15m), refresh TTL (7d), cookie name, Secure flag, SameSite. Compact constructor defaults.
- [x] `security/CookieUtils` — `ResponseCookie`-based set/clear/read for `refresh_token` (HttpOnly, SameSite=Lax, configurable Secure).
- [x] `JwtService` now reads `access-expiration-ms` from `RefreshProperties` (was 24h, now 15m default). Old `app.jwt.expiration-ms` removed.
- [x] `AuthService.login/register/refresh/logout` — `register` + `login` set the refresh cookie; `refresh` rotates (and detects reuse → kills family); `logout` revokes + clears cookie.
- [x] `AuthController` gains `POST /api/auth/refresh` + `POST /api/auth/logout`. Response header `X-Access-Expires-In-Ms` exposes TTL for proactive refresh.
- [x] `ClubAuthService/Controller` mirror all four endpoints (`/api/club/auth/{refresh,logout}`). Members and leaders both work; service looks up the principal in `memberRepo` then `leaderRepo` after rotation.
- [x] `GlobalExceptionHandler` maps `InvalidRefreshException` → 401 (generic message to avoid distinguishing "not found" from "expired"), `ReuseDetectedException` → 401 + WARN log.
- [x] `InnovationBackendApplication` — added `@ConfigurationPropertiesScan`.
- [x] `application.properties` — added `app.refresh.*` block (cookie-secure defaults to `false` for local dev).

**Frontend:**
- [x] `src/api/client.js` — `credentials: 'include'` on every fetch, `silent refresh on 401` with **single in-flight promise** for concurrent 401s, `safeJson` helper, `logout()` helper that revokes the cookie server-side, `api.refresh()` for proactive refresh. Added `X-Access-Expires-In-Ms` honoured (optional).
- [x] `src/club/api/clubApi.js` — same silent-refresh pattern, separate `REFRESH_PATH` (`/api/club/auth/refresh`) + `LOGOUT_PATH`, separate `clubToken` key. `logoutClub()` exported.
- [x] `src/context/AuthContext.jsx` — `logout` is now async and calls `apiLogout()` (revokes refresh cookie). Existing call sites fire-and-forget it; safe because the inner call swallows network errors.
- [x] `src/club/context/ClubContext.jsx` — `logoutClubBackend` is now async and calls `apiClubLogout()`.

**Verify (compile/build only — runtime needs the backend running):**
- [x] `mvn -DskipTests compile` → BUILD SUCCESS
- [x] `npx vite build` → 103 modules, no errors
- [ ] Manual end-to-end (recipe in `/tmp/phase6a-smoke.sh`):
  - [ ] Login → DevTools → Application → Cookies shows `refresh_token` HttpOnly
  - [ ] Manually delete the `token` from localStorage, hit any authed endpoint → silent refresh + retry succeeds
  - [ ] Reuse the OLD refresh cookie value (capture before refresh) → 401 + reuse-detection log
  - [ ] Logout → cookie cleared + DB row `revoked_at` set
  - [ ] Same flow for `/api/club/auth/*`

#### ✅ Phase 6B — Email verification on register (DONE 2026-07-24)
**Backend:**
- [x] `pom.xml` — `spring-boot-starter-mail`
- [x] `V4__email_verification.sql` Flyway migration — `email_verified BOOLEAN NOT NULL DEFAULT TRUE` on `users` + `club_members` (default TRUE so seeded admin/leader accounts are verified); new `email_verification_tokens` table with `surface`, `user_id`, `token_hash`, `expires_at`, `consumed_at`, indexed on `(surface, user_id)` + `expires_at`.
- [x] `auth/EmailVerificationToken.java` entity + `EmailVerificationTokenRepository`
- [x] `common/EmailService.java` — `JavaMailSender`-backed. Failures logged at WARN and swallowed so an SMTP outage doesn't block registration.
- [x] `auth/EmailVerificationService.java` — `issue(surface, userId, email)` (invalidates prior tokens, generates SHA-256-hashed 32-byte URL-safe token, sends email with `verificationUrlBase + raw`), `consume(rawToken)` (sets `consumedAt`, returns the row), `tryConsume(rawToken)` (Optional variant).
- [x] `auth/WriteGuard.java` — `@Component` with `requireVerified()`. Looks up the calling principal in `UserRepository` → `ClubMemberRepository` → `ClubLeaderRepository`; throws `AccessDeniedException("Please verify your email before performing this action")` if `email_verified=false`. ADMIN/CLUB_LEADER pass through.
- [x] `User` and `ClubMember` entities gain `emailVerified` field.
- [x] `UserResponse` DTO gains `emailVerified` boolean.
- [x] `UserService.register` now sets `emailVerified=false` for self-registered accounts.
- [x] `ClubAuthService.register` now sets `emailVerified=false` for self-registered members.
- [x] `AuthService.register` issues a verification token + emails the link right after register.
- [x] `AuthController` gains `GET /api/auth/verify?token=…` (public) and `POST /api/auth/resend-verification` (auth).
- [x] `ClubAuthController` mirrors both: `GET /api/club/auth/verify?token=…` and `POST /api/club/auth/resend-verification`.
- [x] `WriteGuard.requireVerified()` applied at the start of every write controller method:
  - `OpportunityController` (POST/PUT/DELETE)
  - `ApplicationController` (POST apply)
  - `ApplicantController` (PATCH stage)
  - `ProjectController` (POST/PUT/DELETE/PATCH phase + all milestone CRUD)
  - `ProjectAttachmentController` (POST upload, DELETE attachment)
  - `ClubActivityController` (POST/PATCH/DELETE activity + register/unregister)
  - `ClubAnnouncementController` (POST/PATCH/DELETE)
  - (Admin endpoints intentionally NOT gated — admins are seeded + already verified)

**Frontend:**
- [x] `src/pages/VerifyEmail.jsx` (NEW) — handles `?token=…` (verify via backend), `?notice=sent` (informational), `?surface=club` (uses club endpoint). Inline success/error states + a "Go to login" CTA.
- [x] `src/components/Navbar.jsx` — adds a yellow "⚠️ Your email isn't verified" banner when `user.emailVerified === false`, with a "Resend verification email" button that POSTs to `/api/auth/resend-verification`.
- [x] `src/App.jsx` — new route `/verify` → `VerifyEmail`.

**Verify (compile/build only — runtime needs the backend running with Gmail SMTP):**
- [x] `mvn -DskipTests compile` → BUILD SUCCESS
- [x] `npx vite build` → 104 modules, no errors
- [ ] Manual end-to-end (recipe in `/tmp/phase6b-smoke.sh`):
  - [ ] Register a fresh innovator → DB row has `email_verified=false` → gmail inbox shows the email with `?token=…`
  - [ ] Click the link → browser navigates to `/verify?token=…` → backend marks verified → success page
  - [ ] Without verifying, `POST /api/projects` → 403 with "Please verify your email before performing this action"
  - [ ] After verifying, `POST /api/projects` → 201
  - [ ] Click "Resend" → new token issued, prior ones invalidated, email arrives again
  - [ ] Same flow for `/api/club/auth/register` + `/api/club/auth/verify`
  - [ ] Frontend: log in as unverified user → see yellow banner with resend button in Navbar

#### ✅ Phase 6C — Forgot-password / reset-password (DONE 2026-07-24)
**Backend:**
- [x] `V5__password_reset.sql` Flyway migration — `password_reset_tokens` table (mirror of V4: `surface`, `user_id`, `token_hash`, `expires_at`, `consumed_at`, indexed on `(surface, user_id)` + `expires_at`).
- [x] `auth/PasswordResetToken.java` entity + `PasswordResetTokenRepository`.
- [x] `auth/PasswordResetService.java` — `issueForEmail(email)` (looks up User → ClubMember → ClubLeader, returns `Optional<Issued>` so the endpoint can always 202), `consume(rawToken, newPassword)` (validates token, hashes new password, updates User | ClubMember | ClubLeader, **revokes ALL refresh tokens for that principal**, marks token consumed). Same password rules as register page (≥6 chars + digit).
- [x] `auth/RefreshTokenRepository.revokeAllForPrincipal(surface, userId)` — new `@Modifying` query used by `PasswordResetService.consume` so a leaked password's sessions die immediately.
- [x] `user/dto/ForgotPasswordRequest.java` + `ResetPasswordRequest.java` — bean-validated.
- [x] `AuthController` gains `POST /api/auth/forgot-password` (always 202) + `POST /api/auth/reset-password` (204 on success, 400 on bad token, 400 on bad password shape).
- [x] `ClubAuthController` mirrors both (`/api/club/auth/forgot-password` + `/reset-password`). Service does the cross-table lookup so the same surface splits correctly.
- [x] `application.properties` — `app.email.reset-url` + `app.email.reset-expiration-ms` (1h default).
- [x] `GlobalExceptionHandler` — new handler for `PasswordResetService.InvalidResetTokenException` → 400 with generic message (no leak between "expired" / "used" / "not found").

**Frontend:**
- [x] `src/pages/AuthPage.jsx` — `ForgotTab` rewritten: drops the 3-step mock (`Email → 6-digit code → reset`) in favor of a 2-step real flow (`Email → "check your inbox"`). The "Send reset link" button now calls `POST /api/auth/forgot-password`. The "check your inbox" step tells the user to click the link in their email.
- [x] `src/pages/ResetPassword.jsx` (NEW) — reads `?token=…` (and optional `?surface=club`), validates the new password (≥6 + digit + match), POSTs to `/api/auth/reset-password` (or `/api/club/auth/reset-password`), shows a success screen and redirects to `/login`. Inline error UI for bad/expired tokens.
- [x] `src/App.jsx` — new route `/reset-password` → `ResetPassword`.

**Verify (compile/build only — runtime needs the backend running with Gmail SMTP):**
- [x] `mvn -DskipTests compile` → BUILD SUCCESS
- [x] `npx vite build` → 105 modules, no errors
- [ ] Manual end-to-end (recipe in `/tmp/phase6c-smoke.sh`):
  - [ ] `POST /api/auth/forgot-password` with admin email → 202 → check Gmail for the link
  - [ ] `POST /api/auth/forgot-password` with unknown email → 202 (no enumeration)
  - [ ] Click the link → `/reset-password?token=…` → enter new password → success → redirect to login
  - [ ] Log in with new password → access token issued, new refresh cookie
  - [ ] Old refresh cookie is now invalid (revoked by `revokeAllForPrincipal`) → next `/api/auth/refresh` returns 401
  - [ ] Reuse the consumed token → 400
  - [ ] Frontend: visit `/forgot-password` → enter email → "check your inbox" panel
  - [ ] Frontend: open email link → `/reset-password?token=…` → set new password → "Password updated" → redirected to login

#### ✅ Phase 5C-B + earlier hardening (already complete from earlier phases)
- [x] Flyway migrations — in use since Phase 5C-A (V1, V2 in place); V3 added here
- [x] File uploads — Phase 5C-B (multipart, 10MB cap, 5/project limit, storage root config)
- [x] Email service — toast placeholders only (no real SMTP yet)

#### ✅ Phase 6D — Test suite (DONE 2026-07-25)

The Phase 6 services (refresh tokens, email verification, password reset) and the extended `AuthController` shipped with zero test coverage. Phase 6D ships a self-contained test suite that runs from a clean machine with **no Postgres, no Docker, no real SMTP** — `mvn clean test` is the entire setup.

**Infrastructure:**
- [x] `pom.xml` — added `com.h2database:h2` with `<scope>test</scope>` (no version — Spring Boot BOM manages it)
- [x] `src/test/resources/application-test.properties` (NEW) — H2 in `MODE=PostgreSQL` + `DB_CLOSE_DELAY=-1` + `DATABASE_TO_LOWER=TRUE`, Flyway off, Hibernate `create-drop`, safe localhost SMTP, 70-byte JWT secret, all `app.refresh.*` + `app.email.*` mirrors
- [x] `InnovationBackendApplicationTests.contextLoads()` — added `@ActiveProfiles("test")`; the existing test now runs against H2 instead of trying to bootstrap real Postgres + Flyway
- [x] `user/User.java` — added `@Builder.Default` to the seven notification booleans + `emailVerified` so `User.builder()` matches the field-initialiser defaults. The user explicitly requested this fix.

**Production code touched (besides `User`):**
- [x] `auth/RefreshTokenRepository` — `revokeFamily` and `revokeAllForPrincipal` now take `revokedAt: Instant` instead of using `CURRENT_TIMESTAMP` in JPQL. H2 resolves `CURRENT_TIMESTAMP` to `java.sql.Timestamp`, which can't be assigned to our `Instant` field (HHH-17560). Both services updated to pass `Instant.now()`.
- [x] `auth/RefreshTokenRepository.revokeAllForPrincipal` parameter type changed from `String` to `RefreshToken.Surface` (Spring Data is strict about parameter type matching the entity field type — passing a `String` for an enum-typed column fails the binding). `PasswordResetService.consume` updated to map between the two `Surface` enums by name.
- [x] `common/GlobalExceptionHandler` — new handler for `EmailVerificationService.InvalidVerificationTokenException` → 400 (was previously unhandled → 500).

**Test files (7 new, 73 total tests, all green):**

| Layer | File | Cases | What it covers |
|---|---|---|---|
| Unit | `auth/RefreshTokenServiceTest.java` | 9 | Issue (hashed, future expiry, family preservation), rotate (happy path, unknown, expired, reuse-detection + family kill, family isolation), revoke (active, unknown) |
| Unit | `auth/EmailVerificationServiceTest.java` | 8 | Issue (invalidates prior tokens, sends email with correct link, hash ≠ raw), consume (valid, unknown, double-use, expired), tryConsume (invalid, valid) |
| Unit | `auth/PasswordResetServiceTest.java` | 13 | Cross-table lookup (User → ClubMember → ClubLeader), unknown email (no enumeration), consume error paths (unknown/used/expired), per-principal password update (User/ClubMember/ClubLeader), `revokeAllForPrincipal` called with right surface+userId+Instant, password shape enforcement (length + digit) |
| `@DataJpaTest` | `auth/RefreshTokenRepositoryTest.java` | 6 | Hash lookup, unique-constraint enforcement, `revokeFamily` scope, `revokeAllForPrincipal` cross-surface/cross-user scope, `Surface` enum round-trip, `@CreatedDate` populated |
| `@DataJpaTest` | `auth/EmailVerificationTokenRepositoryTest.java` | 7 | Hash lookup, unique-constraint, `consumedAt` persistence, `isExpired` for past/future, `Surface` round-trip, auditing |
| `@DataJpaTest` | `auth/PasswordResetTokenRepositoryTest.java` | 7 | Same shape as the email-verification test |
| `@WebMvcTest` | `auth/AuthControllerWebMvcTest.java` | 22 | Register (201 + cookie, 400 on short pw / no digit / missing email), login (200 + cookie, 400 on missing email), refresh (200, 401 on `InvalidRefreshException`, 401 on `ReuseDetectedException`, 401 on missing cookie), logout (204), verify (200, 400 on invalid token), resend (202), forgot-password (202 for known AND unknown email — anti-enumeration, 400 on malformed email), reset-password (204, 400 on short pw / no digit / invalid token), endpoint path smoke |

**Verify (end-to-end from a clean machine):**
```bash
cd "Innovation_backend"
mvn clean test
# → Tests run: 73, Failures: 0, Errors: 0, Skipped: 0
# → BUILD SUCCESS in ~18 s
```

Inner loop (one class at a time):
```bash
mvn -Dtest=RefreshTokenServiceTest test
mvn -Dtest=AuthControllerWebMvcTest test
# etc — see the seven class names above
```

**Out of scope (deliberately skipped):**
- `EmailService.send` — one-line SMTP passthrough; swallowed exceptions; mocked everywhere
- `ClubAuthService` — mirrors `AuthService`; can be added later if behaviour diverges
- `ProjectService.create` — high fixture cost; not Phase-6-specific
- Per-controller `WriteGuard` calls — the guard itself can get a focused unit test later
- jjwt library internals
- Flyway-on-H2 migration portability — `create-drop` builds the schema from entities, not from migrations
- Real SMTP delivery
- Testcontainers / Docker

> **Note:** Phase 6 of the original plan ("Frontend integration") has been **dissolved into Phases 2–4**. Every backend phase now ships with a corresponding frontend patch so the user can test in the React UI immediately. This is the parallel workflow.

---

## 7. Trade-offs & Open Questions

1. **Single login or two?** Frontend has unified `/login` page but two contexts (`AuthContext`, `ClubContext`). Two backend endpoints is simplest. If you prefer one, we'd need a `surface` field. **Recommendation:** two endpoints (`/api/auth/*` and `/api/club/auth/*`).
2. **Email uniqueness** — confirm ok as a single login id across surfaces. Decision: yes, email is globally unique across all users (innovator/funder/admin/club-member/club-leader). Different entities (`User` vs `ClubMember`) but same uniqueness rule.
3. **Opportunity types** — frontend hardcodes lists of 4–7 names in different places. I'll unify to: `Grant | Accelerator | Challenge | Fellowship | Equity Funding | Seed Funding | Prize`.
4. **Application stage vocab** — frontend has two parallel sets. I'll use snake_case for DB: `submitted | under_review | interview | pitch | shortlisted | accepted | rejected`.
5. **Avatar upload** — frontend stub only. Backend can skip for now, add in Phase 7.
6. **Email service** — toasts only. Will defer to Phase 7.

---

## 8. Next Step

Innovation surface is feature-complete (Phases 0–3C) and the club surface is at Phase 4 + Phase 5A. The Phase 5B sub-phases (Elections, Meetings, Treasury, Discipline, Amendments, Dissolutions, Onboarding, Handover) were **removed 2026-07-24** as out of MVP scope — see the ⛔ banner above Phase 5B.

Going forward, the live features are:

- Innovation: register/login, innovator projects + ZSA approval, opportunities + organizations + applications (funder-gated), admin moderation + stats.
- Club: branch listing + detail (university-scoped), member registration + leader approval, leader dashboard, club projects, **read-only** executive committee / position duties / patron, constitution viewer, code of conduct signatures, conflict-of-interest disclosure, IP registry.

Suggested next moves (any of):
1. **Phase 6 — Hardening** — Flyway migrations, refresh tokens, file uploads, real email service. See the deferred list below.
2. Re-introduce one of the removed club sub-phases if the product needs it (Elections is the most-likely candidate; design artifacts are in git history).
3. Polish existing flows — empty states, error toasts, mobile responsiveness.

---

## 9. Parallel Front-End + Back-End Workflow

The user is intentionally developing **both** the Spring Boot backend (`Innovation_backend/`) and the React frontend (`Innovation/`) **at the same time**. Each backend phase therefore ships with a **small, targeted frontend patch** so new features can be exercised in the React UI immediately.

### When starting a new session, ALWAYS do this first:

1. **Read this file** (`IMPLEMENTATION_PLAN.md`) to see which phase we're on and which sub-bullets are done vs. open.
2. **Check the running processes:**
   - Backend: `http://localhost:8080/api/health` should return 200 JSON
   - Frontend: `http://localhost:5173/` should return HTML
3. **Confirm the chosen patterns** from §10 below before writing any new code.

### Per-phase rhythm

For every open phase, follow this loop:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Show the user what the phase will build (files + endpoints)   │
│ 2. Confirm scope before writing code                              │
│ 3. Write backend files (entity / repo / service / controller /   │
│    DTO)                                                          │
│ 4. Tell the user to manual-restart Spring Boot                   │
│    (Ctrl+C, then `mvn spring-boot:run`)                          │
│ 5. User verifies with curl where possible                        │
│ 6. Apply the corresponding frontend patch                        │
│ 7. User verifies end-to-end in the React UI                      │
│ 8. Mark phase done in §6 of this file                            │
│ 9. PAUSE and ask before starting the next phase                  │
└─────────────────────────────────────────────────────────────────┘
```

### What "frontend patch" means in practice

- Touch the **smallest** number of React files needed (typically 1–3)
- Prefer keeping existing sync APIs (`login()`, `register()`, etc.) working — make them async internally, surface backend errors to the form
- Use the existing `src/api/client.js` `api` object — do NOT add axios
- Keep mock data as a fallback when the backend is unreachable
- Never break an unrelated page; if a refactor is wide, ask first
- Restart of the frontend dev server is automatic (Vite HMR)

### When the user says "go" or "begin phase X"

Immediately re-read §6 of this file, identify the open sub-bullets for that phase, and execute the loop above. Do NOT skip the confirm-scope step.

---

## 10. Locked-in patterns (do not re-ask each session)

These were settled by the user. Treat them as facts unless the user explicitly changes one.

| Decision | Value |
|---|---|
| Package layout | **Feature folders** (entity / repo / service / controller inside each domain package, e.g. `user/`, `opportunity/`) |
| Role strategy | Two enums — `user.Role` (`INNOVATOR`/`FUNDER`/`ADMIN`) and `club.ClubRole` (`CLUB_MEMBER`/`CLUB_LEADER`) |
| Role casing in JSON | **lowercase** (`"innovator"`, `"funder"`, `"admin"`, `"club-member"`, `"club-leader"`) to match the existing React code |
| Auth endpoints | **Two**: `/api/auth/*` and `/api/club/auth/*` |
| Restart style | **Manual restart** after each phase (Ctrl+C + `mvn spring-boot:run`) — DevTools auto-restart was declined |
| Admin seed | `admin@innovation.local / Admin123!` (created by `DataSeedRunner` if missing) |
| Frontend HTTP client | Plain `fetch` via `src/api/client.js` — no axios |
| JWT storage in frontend | `localStorage` under key `"token"` |
| Validation rules | Password ≥ 6 chars, contains at least one digit (matches `RegisterPage.jsx`) |
| Test data on backend startup | None for users (only admin is seeded); no opportunities/projects seeded |
| Decisions still open | §7 — re-read before changing role-casing, opportunity type vocab, application stage vocab |


Phase 5B-2 — Club Activities (new sub-phase)
Backend: ClubActivity entity (FK to Club + author member/leader), ActivityRegistration for member signups. Endpoints: GET /api/club/branches/{id}/activities (public to same-university auth), POST /api/club/branches/{id}/activities (leader), PATCH /api/club/activities/{id} (leader/owner), POST /api/club/activities/{id}/register (member), DELETE /api/club/activities/{id}/register (un-register).
Frontend: ClubActivities.jsx (member browse + register), ClubManageActivities.jsx (leader CRUD), sidebar links, ClubContext state slots.


Phase 5B-3 — Club Announcements (new sub-phase, smaller)
Backend: ClubAnnouncement entity. Endpoints: GET /api/club/branches/{id}/announcements, POST (leader), DELETE (leader/owner).
Frontend: feed rendered at top of ClubBranchDetail.jsx; leader CRUD page.
Phase 5C — Unify projects + evidence ✅ COMPLETE 2026-07-24

5C-A — Single `projects` table (polymorphic author via 3 nullable FKs + CHECK constraint).
`surface` enum (`INNOVATION` | `CLUB`) is derived server-side from the JWT role, never
the request body — prevents a club member from impersonating INNOVATION to skip the
admin ZSA approval. Club rows are gated by same-university; cross-uni reads return 404.

5C-B — Local-filesystem evidence storage under `${user.home}/innovation-uploads`
(was `/var/innovation/uploads`, which required sudo). 10 MB per file, 5 attachments per
project (enforced under PESSIMISTIC_WRITE lock).

Auth matrix for evidence (upload + list + download + delete):
- INNOVATION rows: owner OR admin
- CLUB rows:     owner OR leader-of-same-**university** OR admin
- Anything else:  404 (privacy)

Plan originally said "leader of same branch" — implementation is "leader of same
university" because `ClubLeader` is university-scoped per the entity doc (one leader
may oversee several branches). Documented in the `ClubAccessChecks.requireLeaderOfSameUniversityOrOwnerOrAdmin`
javadoc.

Verification: `mvn clean compile` ✅ · `npm run build` ✅ · both migrations ran cleanly
on a populated DB ✅ · `curl GET /api/projects/1` returns the unified response shape ✅.