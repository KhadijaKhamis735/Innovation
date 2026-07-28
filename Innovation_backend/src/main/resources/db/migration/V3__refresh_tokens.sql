-- Phase 6A: refresh tokens
--
-- Stores hashed refresh tokens (SHA-256 of the raw token — we never keep
-- the raw token in the DB). One row per issued token. When a token is
-- rotated, the old row gets `revoked_at` set and `replaced_by_id` points
-- to the new row. Tokens belong to a `family_id` so we can detect reuse
-- (the family is killed if a revoked token is presented again).
--
-- `surface` distinguishes innovation tokens (User) from club tokens
-- (ClubMember | ClubLeader) since they live in different tables and
-- have no shared parent.

CREATE TABLE refresh_tokens (
    id              BIGSERIAL    PRIMARY KEY,
    surface         VARCHAR(16)  NOT NULL,
    user_id         BIGINT       NOT NULL,
    family_id       UUID         NOT NULL,
    token_hash      VARCHAR(64)  NOT NULL UNIQUE,   -- SHA-256 hex digest (64 chars)
    expires_at      TIMESTAMP    NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at      TIMESTAMP    NULL,
    replaced_by_id  BIGINT       NULL REFERENCES refresh_tokens(id) ON DELETE SET NULL,

    CONSTRAINT refresh_tokens_surface_chk
        CHECK (surface IN ('INNOVATION', 'CLUB'))
);

-- Lookup by token hash (UNIQUE already provides an index, but naming it
-- explicitly so the planner can be obvious about it).
CREATE INDEX idx_refresh_tokens_user
    ON refresh_tokens (surface, user_id);

CREATE INDEX idx_refresh_tokens_family
    ON refresh_tokens (family_id);

-- Clean up expired/revoked rows (best-effort, not required for correctness).
CREATE INDEX idx_refresh_tokens_expires_at
    ON refresh_tokens (expires_at);
