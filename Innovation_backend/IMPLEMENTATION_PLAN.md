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
- [ ] `src/pages/innovator/MyProjects.jsx` → CRUD against `/api/projects/*` (NEXT)
- [ ] `src/pages/admin/AdminProjects.jsx` (NEW) → list pending, approve/reject/override (NEXT)
- [ ] Empty state + error banner when backend is unreachable (NO mock fallback)

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

#### 🟦 Phase 3B — Opportunities + Organizations (after 3A verified)
**Backend:**
- [ ] `opportunity/` package: `Opportunity` entity, `OpportunityType` + `OpportunityStatus` enums, repo, service, controller
- [ ] `organization/` package: `Organization` entity, `OrganizationStatus` enum, repo, service, controller
- [ ] Endpoints (public reads + funder writes + admin moderation):
  - `GET    /api/opportunities                              (public) ?status=&search=&type=`
  - `GET    /api/opportunities/{id}                         (public)`
  - `POST   /api/opportunities                              (funder)` — **requires at least one APPROVED Organization; else 403**
  - `PUT    /api/opportunities/{id}                         (funder, owner)`
  - `DELETE /api/opportunities/{id}                         (funder, owner | admin)`
  - `GET    /api/admin/opportunities                        (admin)`
  - `GET    /api/admin/organizations                        (admin)`
  - `PATCH  /api/admin/organizations/{id}/status  { status } (admin)`
- [ ] On funder register: auto-create a `PENDING` Organization row (so admins always have something to approve)
- [ ] On admin approve: funder gains posting ability immediately

**Frontend patch:**
- [ ] `src/pages/opportunity/PublicOpportunities.jsx` → fetch `GET /api/opportunities`
- [ ] `src/pages/opportunity/PublicOpportunityDetail.jsx` → render real opportunity
- [ ] `src/pages/funder/PostOpportunity.jsx` → POST + handle 403 ("organization not approved")
- [ ] `src/pages/funder/MyPostedOpportunities.jsx` → funder's own list (PUT/DELETE)
- [ ] `src/pages/admin/AdminOrganizations.jsx` → list + approve/reject
- [ ] `src/pages/admin/AdminOpportunities.jsx` → admin view

**Verify (end-to-end):**
- [ ] Register a new funder → admin sees a new PENDING organization → admin approves it
- [ ] Funder (now approved) posts an opportunity → public list shows it
- [ ] Innovator sees the new opportunity on `/opportunities`
- [ ] Funder who is NOT approved tries to POST → gets `403`
- [ ] Admin can DELETE any opportunity

#### 🟦 Phase 3C — Applications (after 3B verified)
**Backend:**
- [ ] `application/` package: `Application` entity, `ApplicationStage` enum, repo, service, controller
- [ ] Endpoints:
  - `POST   /api/opportunities/{id}/apply            (innovator)  { ideaTitle, problemStatement, proposedSolution, estimatedBudget }`
  - `GET    /api/applications/me                      (innovator)`
  - `GET    /api/opportunities/{id}/applicants       (funder, owner | admin)`
  - `PATCH  /api/applications/{id}/stage              (funder, opportunity-owner | admin)  { stage }`
- [ ] Innovator can apply once per opportunity (unique constraint on `opportunity_id + innovator_id`)
- [ ] Stage moves are **flexible** in 3C (funder can move to any stage). Tighten to linear in a later hardening phase if needed.

**Frontend patch:**
- [ ] `src/pages/opportunity/PublicOpportunityDetail.jsx` → wire Apply button to `POST /api/opportunities/:id/apply`
- [ ] `src/pages/innovator/MyApplication.jsx` → fetch from `GET /api/applications/me`
- [ ] `src/pages/funder/ReceivedApplications.jsx` → fetch `GET /api/opportunities/:id/applicants` + `PATCH /api/applications/:id/stage`

**Verify (end-to-end):**
- [ ] Innovator applies to funder's opportunity → funder sees the application
- [ ] Funder moves stage `SUBMITTED → UNDER_REVIEW → ACCEPTED` → innovator sees updated stage
- [ ] Innovator tries to apply to the same opportunity twice → backend rejects
- [ ] Different funder cannot view applicants for an opportunity they don't own

### 🟣 Phase 4 — Club auth & core (members, leaders, branches)
**Backend:**
- [ ] `club/` package: `University`, `Club` (Branch), `ClubMember`, `ClubLeader` entities
- [ ] `club/ClubRole` enum (`CLUB_MEMBER`/`CLUB_LEADER`)
- [ ] `University` seeded with the 4 hard-coded rows (SUZA, ZU, SUMAIT, KIST)
- [ ] `POST /api/club/auth/register` — 4 categories (student/staff/alumni/corporate)
- [ ] `POST /api/club/auth/login` → `{ token, role, kind }`
- [ ] `GET /api/club/branches`, `/api/club/branches/:id`, `/api/club/branches/:id/members`
- [ ] Leader approve/reject endpoints

**Frontend patches (planned):**
- [ ] Refactor `src/club/context/ClubContext.jsx` to call backend instead of localStorage
- [ ] Replace club register/login forms to call `/api/club/auth/*`
- [ ] `/club/branches/*` pages fetch real data

**Verify (end-to-end):**
- [ ] Register a student club member via Club Register form
- [ ] Register a club leader (seeded via DataSeedRunner)
- [ ] Leader logs in → approves the student
- [ ] Student logs in → sees their pending → active status change

### 🟠 Phase 5 — Club extended (deferred — only on request)
Elections, meetings, treasury, IP, discipline, amendments, dissolutions, onboarding.
> **Each is its own sub-phase** because of the state machines and rules. Will batch only after core is stable.

### ⚪ Phase 6 — Hardening (later)
- [ ] Refresh tokens
- [ ] Email verification on register
- [ ] Forgot-password flow
- [ ] Flyway migrations (replace `ddl-auto=update`)
- [ ] File uploads (avatar, opportunity images, IP attachments)
- [ ] Real email service (queue the toast "email sent" placeholders from `AdminDashboard`/`ReceivedApplications`)
- [ ] Comprehensive tests (unit + integration)

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

**Proceed to Phase 3A: Innovator Projects (independent, safe starting point).** Stop and confirm after 3A before starting 3B.

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
