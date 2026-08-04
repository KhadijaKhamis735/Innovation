-- =====================================================================
-- V9 — Link applications to tracked projects
-- =====================================================================
-- Before this migration an application was always a free-text pitch:
-- the innovator retyped idea title / problem / solution even when the
-- idea was already an APPROVED project with a ZSA ID, a tracked stage
-- and uploaded evidence. The funder had no way to tell that the pitch in
-- front of them corresponded to a real, admin-approved project.
--
-- Design notes:
--   * `project_id` is NULLABLE. "Apply with a new idea" stays the
--     default path and writes NULL, so every existing row is valid
--     without a backfill.
--   * ON DELETE SET NULL, not CASCADE. Deleting a project must not
--     silently delete the funder's application record — the funder is
--     mid-review and the application's own snapshot columns
--     (idea_title, problem_statement, ...) still describe what was
--     pitched. The link simply goes away.
--   * NO unique constraint on (project_id, opportunity_id) beyond the
--     existing uk_app_opportunity_innovator. A project may receive
--     support from multiple funders — that is an explicit product rule,
--     so nothing here blocks a second application for the same project
--     to a different opportunity.
--   * `pitch_note` is the one free-text field an existing-project
--     application still asks for ("why this opportunity fits"). The
--     rest of the pitch is read live from the project.
-- =====================================================================

BEGIN;

ALTER TABLE applications
    ADD COLUMN project_id BIGINT;

ALTER TABLE applications
    ADD CONSTRAINT fk_app_project
        FOREIGN KEY (project_id) REFERENCES projects (id)
        ON DELETE SET NULL;

-- Drives the "has this project already been funded elsewhere?" transparency
-- lookup on the funder's application detail view, which filters applications
-- by project_id. Partial — the vast majority of rows are new-idea (NULL).
CREATE INDEX idx_app_project
    ON applications (project_id)
    WHERE project_id IS NOT NULL;

-- Short "why this opportunity fits" note supplied when applying with an
-- existing project. TEXT rather than VARCHAR for consistency with the
-- other free-text application columns (motivation, hopes_to_gain).
ALTER TABLE applications
    ADD COLUMN pitch_note TEXT;

COMMIT;
