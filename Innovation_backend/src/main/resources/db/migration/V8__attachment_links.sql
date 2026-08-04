-- =====================================================================
-- V8 — Link evidence on project attachments
-- =====================================================================
-- Evidence may now be EITHER an uploaded file OR an external link
-- (demo video, repo, prototype URL). Before this migration the table
-- could only describe a file: `storage_path` was NOT NULL and there
-- was nowhere to put a URL.
--
-- Design notes:
--   * `storage_path` becomes nullable — a link row has no file on disk.
--   * A CHECK enforces the payload invariant: exactly one of
--     (storage_path, link_url) is populated. That mirrors the existing
--     `chk_attachments_uploader` polymorphic-uploader style.
--   * `original_filename` and `size_bytes` stay NOT NULL. Link rows
--     store a display label (the URL host) and 0 bytes, which keeps the
--     entity's primitive `long sizeBytes` and every existing response
--     field working unchanged. 0 satisfies chk_attachments_size.
-- =====================================================================

ALTER TABLE project_attachments
    ADD COLUMN link_url VARCHAR(2048);

ALTER TABLE project_attachments
    ALTER COLUMN storage_path DROP NOT NULL;

-- Payload invariant: a row is either a stored file or an external link,
-- never both and never neither.
ALTER TABLE project_attachments
    ADD CONSTRAINT chk_attachments_payload CHECK (
        (storage_path IS NOT NULL AND link_url IS NULL)
     OR (link_url     IS NOT NULL AND storage_path IS NULL)
    );

-- The evidence-required gate on PATCH /api/projects/{id}/phase counts
-- attachments per (project, kind); this index keeps that count cheap.
CREATE INDEX idx_attachments_project_kind
    ON project_attachments (project_id, kind);
