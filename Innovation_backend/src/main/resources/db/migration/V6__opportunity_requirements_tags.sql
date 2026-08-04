-- V6 — Phase 5 opportunity management.
--   Persist `requirements` (free-form eligibility text) and `tags` (JSONB array
--   of short strings) on the `opportunities` table. Both UIs (mobile + web)
--   already collect these values via the post form but were discarding them.
--
-- Notes:
--   * requirements is nullable — not every opportunity has explicit eligibility
--     criteria, and forcing NOT NULL here would force existing rows to be
--     re-edited.
--   * tags is NOT NULL with a default of '[]' so the Hibernate JSON mapping
--     never has to handle a SQL NULL. The @Builder.Default in Opportunity.java
--     keeps the entity in lock-step with the DB.
--   * No backfill: in dev/test there are no rows with non-null values; the
--     default expression handles the empty case.

ALTER TABLE opportunities
    ADD COLUMN requirements TEXT;

ALTER TABLE opportunities
    ADD COLUMN tags JSONB NOT NULL DEFAULT '[]'::jsonb;