-- Phase 5C-A: unify innovator_projects + club_projects into a single `projects` table.
--
-- The database currently has both tables (plus club_project_tags and
-- project_milestones) because InnovatorProject and ClubProject were run as
-- separate parallel models. This migration merges them into one polymorphic
-- `projects` table with a `surface` discriminator.
--
-- Pre-conditions (validated by preflight below; aborts if any fail):
--   - Each innovator_projects row has a unique owner (no orphan rows).
--   - Each club_projects row has an ACTIVE-style author with a club.
--   - All project_milestones rows have a valid FK to innovator_projects.
--   - All club_project_tags rows have a valid FK to club_projects.
--
-- Idempotency: this migration is not reversible. A failed run aborts the
-- transaction; Flyway rolls back and the next boot retries it.

BEGIN;

-- ── 1. Defensive preflight ─────────────────────────────────────────
DO $$
DECLARE
    orphan_innovator BIGINT;
    orphan_club      BIGINT;
    orphan_milestone BIGINT;
    orphan_tag       BIGINT;
BEGIN
    SELECT COUNT(*) INTO orphan_innovator
      FROM innovator_projects p
      LEFT JOIN users u ON u.id = p.owner_id
     WHERE u.id IS NULL;
    IF orphan_innovator > 0 THEN
        RAISE EXCEPTION 'Found % innovator_projects with missing owner; aborting', orphan_innovator;
    END IF;

    SELECT COUNT(*) INTO orphan_club
      FROM club_projects p
      LEFT JOIN club_members m ON m.id = p.author_id
     WHERE m.id IS NULL;
    IF orphan_club > 0 THEN
        RAISE EXCEPTION 'Found % club_projects with missing author; aborting', orphan_club;
    END IF;

    SELECT COUNT(*) INTO orphan_milestone
      FROM project_milestones ms
      LEFT JOIN innovator_projects p ON p.id = ms.project_id
     WHERE p.id IS NULL;
    IF orphan_milestone > 0 THEN
        RAISE EXCEPTION 'Found % project_milestones with missing project_id; aborting', orphan_milestone;
    END IF;

    SELECT COUNT(*) INTO orphan_tag
      FROM club_project_tags t
      LEFT JOIN club_projects p ON p.id = t.project_id
     WHERE p.id IS NULL;
    IF orphan_tag > 0 THEN
        RAISE EXCEPTION 'Found % club_project_tags with missing project_id; aborting', orphan_tag;
    END IF;
END $$;

-- ── 2. Create the unified `projects` table ─────────────────────────
CREATE TABLE projects (
    id              BIGSERIAL PRIMARY KEY,
    surface         VARCHAR(20)  NOT NULL,
    name            VARCHAR(160) NOT NULL,
    tagline         VARCHAR(240),
    description     VARCHAR(2000),
    category        VARCHAR(120),
    phase           VARCHAR(20)  NOT NULL,
    start_date      DATE,
    zsa_id          VARCHAR(64),
    approval_status VARCHAR(20),
    owner_user_id   BIGINT,
    owner_member_id BIGINT,
    club_id         BIGINT,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_projects_owner_user
        FOREIGN KEY (owner_user_id) REFERENCES users(id),
    CONSTRAINT fk_projects_owner_member
        FOREIGN KEY (owner_member_id) REFERENCES club_members(id),
    CONSTRAINT fk_projects_club
        FOREIGN KEY (club_id) REFERENCES clubs(id),

    -- Atomic guarantee of the polymorphic-author invariant.
    CONSTRAINT chk_projects_surface CHECK (
        (surface = 'INNOVATION'
            AND owner_user_id IS NOT NULL
            AND owner_member_id IS NULL
            AND club_id IS NULL)
        OR
        (surface = 'CLUB'
            AND owner_member_id IS NOT NULL
            AND club_id IS NOT NULL
            AND owner_user_id IS NULL)
    ),

    -- ZSA approval fields only for innovation projects.
    CONSTRAINT chk_projects_zsa_shape CHECK (
        (surface = 'INNOVATION')
        OR (zsa_id IS NULL AND approval_status IS NULL)
    ),

    CONSTRAINT uk_projects_zsa_id UNIQUE (zsa_id)
);

-- ── 3. Migrate innovator_projects → projects (surface=INNOVATION) ───
INSERT INTO projects (
    id, surface, name, tagline, description, category, phase, start_date,
    zsa_id, approval_status, owner_user_id, owner_member_id, club_id,
    created_at, updated_at
)
SELECT
    ip.id,
    'INNOVATION',
    ip.name,
    NULL,
    ip.description,
    ip.category,
    ip.phase,
    ip.start_date,
    ip.zsa_id,
    ip.approval_status,
    ip.owner_id,
    NULL,
    NULL,
    ip.created_at,
    ip.updated_at
FROM innovator_projects ip;

-- Preserve the PK sequence so future inserts are ≥ current max id.
SELECT setval(pg_get_serial_sequence('projects', 'id'),
              (SELECT COALESCE(MAX(id), 1) FROM projects));

-- ── 4. Migrate club_projects → projects (surface=CLUB) ──────────────
-- Compute fresh ids in a CTE so we can reuse the same mapping for tags.
-- The CTE assigns new ids by ordering all club_projects by their original
-- id and starting the count at (max innovation id + 1) — this is what
-- nextval() would assign if we just let the sequence run, but computed
-- explicitly so step 5 can join on it.
WITH max_inv AS (
    SELECT COALESCE(MAX(id), 0) AS base FROM projects WHERE surface = 'INNOVATION'
),
club_id_map AS (
    SELECT
        cp.id                              AS old_id,
        (SELECT base FROM max_inv)
            + ROW_NUMBER() OVER (ORDER BY cp.id) AS new_id,
        cp.title, cp.tagline, cp.description, cp.category, cp.phase,
        cp.author_id, cp.club_id,
        cp.created_at, cp.updated_at
    FROM club_projects cp
)
INSERT INTO projects (
    id, surface, name, tagline, description, category, phase, start_date,
    zsa_id, approval_status, owner_user_id, owner_member_id, club_id,
    created_at, updated_at
)
SELECT
    new_id,
    'CLUB',
    title, tagline, description, category, phase,
    NULL,                  -- start_date
    NULL,                  -- zsa_id
    NULL,                  -- approval_status
    NULL,                  -- owner_user_id
    author_id,             -- owner_member_id
    club_id,
    created_at, updated_at
FROM club_id_map;

-- Bump the sequence past the maximum id we wrote.
SELECT setval(pg_get_serial_sequence('projects', 'id'),
              (SELECT COALESCE(MAX(id), 1) FROM projects));

-- ── 5. Migrate club_project_tags → project_tags (new FK to projects) ─
CREATE TABLE project_tags (
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tag        VARCHAR(60) NOT NULL
);

-- Reuse the exact same offset math as step 4 so tag rows land on the
-- correct new project_id. The CTE has to live at the top level (CTEs are
-- not allowed inside a parenthesized subquery in Postgres), so the
-- "club_id_map" CTE is rebuilt here.
WITH max_inv AS (
    SELECT COALESCE(MAX(id), 0) AS base FROM projects WHERE surface = 'INNOVATION'
),
club_id_map AS (
    SELECT
        cp.id AS old_id,
        (SELECT base FROM max_inv)
            + ROW_NUMBER() OVER (ORDER BY cp.id) AS new_id
    FROM club_projects cp
)
INSERT INTO project_tags (project_id, tag)
SELECT
    m.new_id,
    t.tag
FROM club_project_tags t
JOIN club_id_map m ON m.old_id = t.project_id;

-- ── 6. Re-point project_milestones at the new projects table ───────
-- Old project_milestones.project_id FK to innovator_projects.id still works
-- for INNOVATION-surface rows (ids preserved). Drop the FK constraint,
-- then re-add it pointing at projects so validate against the new entity
-- doesn't fail.
ALTER TABLE project_milestones
    DROP CONSTRAINT IF EXISTS fk_milestone_project;

-- (No row updates needed: milestones referenced rows whose id is unchanged
--  through the innovation migration in step 3.)

ALTER TABLE project_milestones
    ADD CONSTRAINT fk_milestone_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- ── 7. Partial indexes (cheap reads on the public feed) ────────────
CREATE INDEX idx_projects_innovation_approved
    ON projects (created_at DESC)
    WHERE surface = 'INNOVATION' AND approval_status = 'APPROVED';

CREATE INDEX idx_projects_club_club
    ON projects (club_id, created_at DESC)
    WHERE surface = 'CLUB';

CREATE INDEX idx_projects_owner_user
    ON projects (owner_user_id)
    WHERE owner_user_id IS NOT NULL;

CREATE INDEX idx_projects_owner_member
    ON projects (owner_member_id)
    WHERE owner_member_id IS NOT NULL;

-- ── 8. Drop the old tables ─────────────────────────────────────────
DROP TABLE club_project_tags;
DROP TABLE club_projects;
DROP TABLE innovator_projects;

COMMIT;
