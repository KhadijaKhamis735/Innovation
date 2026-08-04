-- V7 — Phase 8: dynamic application forms.
--
--   Give funders a toggle that picks the kind of application form an
--   opportunity uses. Two values:
--     INNOVATION_APPLICATION — full innovation pitch (Grants, Funding,
--       Competitions, Prizes). The current Idea Title / Problem Statement /
--       Proposed Solution / Estimated Budget fields.
--     PROFILE_APPLICATION   — lighter profile-style form (Mentorship,
--       Training, Bootcamps, Fellowships). Full Name / University / Year of
--       Study / Location / Motivation / Hopes / CV.
--
--   The application row decides which fields it stores via the optional
--   columns below. Existing rows backfill to the legacy shape by leaving
--   the new fields NULL — the legacy four-column fields stay NOT NULL so the
--   current Application entity doesn't need a nullable flip.
--
--   Default INNOVATION_APPLICATION so any opportunity created without
--   picking a form type still accepts the existing Full Innovation flow.

BEGIN;

-- ── Per-opportunity form type ─────────────────────────────────────────
ALTER TABLE opportunities
    ADD COLUMN application_form_type VARCHAR(32) NOT NULL
        DEFAULT 'INNOVATION_APPLICATION'
        CHECK (application_form_type IN ('INNOVATION_APPLICATION', 'PROFILE_APPLICATION'));

-- ── Application extensions ────────────────────────────────────────────
-- Current stage of the project being pitched (INNOVATION_APPLICATION only).
ALTER TABLE applications
    ADD COLUMN current_stage VARCHAR(32);

-- Optional supporting documents (free text — URLs, filenames, or notes).
-- Both forms support a single optional document field; we keep one column
-- so the simple profile form's "CV / Portfolio" and the innovation form's
-- "Supporting Documents" can share storage.
ALTER TABLE applications
    ADD COLUMN supporting_documents TEXT;

-- Profile-style application fields (PROFILE_APPLICATION only).
ALTER TABLE applications
    ADD COLUMN university VARCHAR(200);
ALTER TABLE applications
    ADD COLUMN year_of_study VARCHAR(50);
ALTER TABLE applications
    ADD COLUMN applicant_location VARCHAR(200);
ALTER TABLE applications
    ADD COLUMN motivation TEXT;
ALTER TABLE applications
    ADD COLUMN hopes_to_gain TEXT;

-- Denormalised applicant identity + the optional CV/Portfolio link.
ALTER TABLE applications
    ADD COLUMN full_name VARCHAR(200);
ALTER TABLE applications
    ADD COLUMN email VARCHAR(200);
ALTER TABLE applications
    ADD COLUMN cv_link TEXT;

COMMIT;
