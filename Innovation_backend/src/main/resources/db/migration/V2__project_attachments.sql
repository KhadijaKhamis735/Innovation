-- =====================================================================
-- V2 — Project attachments (Phase 5C-B: file-upload evidence)
-- =====================================================================
-- Adds the `project_attachments` table that backs evidence uploads on the
-- unified `projects` table. The CHECK constraint enforces the polymorphic
-- uploader invariant (mirroring the project's own surface rules): exactly
-- one of (uploaded_by_user_id, uploaded_by_member_id) is populated.
--
-- The FK uses ON DELETE CASCADE — deleting a project removes all attachment
-- rows in one statement. A separate cleanup pass can reap the orphaned
-- files on disk later.
-- =====================================================================

CREATE TABLE project_attachments (
    id                      BIGSERIAL PRIMARY KEY,

    -- Parent project. CASCADE on delete removes all rows in one statement.
    project_id              BIGINT       NOT NULL,
        CONSTRAINT fk_attachments_project
            FOREIGN KEY (project_id)
            REFERENCES projects (id)
            ON DELETE CASCADE,

    original_filename       VARCHAR(240) NOT NULL,
    storage_path            VARCHAR(512) NOT NULL,
    mime_type               VARCHAR(120),
    size_bytes              BIGINT       NOT NULL,
    kind                    VARCHAR(20)  NOT NULL DEFAULT 'EVIDENCE',

    uploaded_by_user_id     BIGINT,
        CONSTRAINT fk_attachments_user
            FOREIGN KEY (uploaded_by_user_id)
            REFERENCES users (id)
            ON DELETE SET NULL,

    uploaded_by_member_id   BIGINT,
        CONSTRAINT fk_attachments_member
            FOREIGN KEY (uploaded_by_member_id)
            REFERENCES club_members (id)
            ON DELETE SET NULL,

    caption                 VARCHAR(240),
    uploaded_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Polymorphic uploader invariant: exactly one of user/member is set.
    CONSTRAINT chk_attachments_uploader CHECK (
        (uploaded_by_user_id IS NOT NULL AND uploaded_by_member_id IS NULL)
     OR (uploaded_by_member_id IS NOT NULL AND uploaded_by_user_id IS NULL)
    ),

    -- Size sanity check — application enforces the 10 MB cap, but a DB-level
    -- bound protects against rogue callers who bypass the service layer.
    CONSTRAINT chk_attachments_size CHECK (size_bytes >= 0 AND size_bytes <= 10485760)
);

-- Listing per project sorted newest-first is the hot path.
CREATE INDEX idx_attachments_project
    ON project_attachments (project_id, uploaded_at DESC);

-- The "find uploader's recent uploads" query (admin/moderation surface)
-- benefits from these secondary indexes even though they're rarely hit.
CREATE INDEX idx_attachments_user
    ON project_attachments (uploaded_by_user_id)
    WHERE uploaded_by_user_id IS NOT NULL;

CREATE INDEX idx_attachments_member
    ON project_attachments (uploaded_by_member_id)
    WHERE uploaded_by_member_id IS NOT NULL;
