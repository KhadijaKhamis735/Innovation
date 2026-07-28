-- Phase 6C — password reset tokens
--
-- Same shape as V4 (email_verification_tokens). One row per issued token,
-- hashed (SHA-256 hex), single-use, 24h expiry. `surface` distinguishes
-- innovation (User) from club (ClubMember).

BEGIN;

CREATE TABLE password_reset_tokens (
    id              BIGSERIAL    PRIMARY KEY,
    surface         VARCHAR(16)  NOT NULL,
    user_id         BIGINT       NOT NULL,
    token_hash      VARCHAR(64)  NOT NULL UNIQUE,   -- SHA-256 hex digest
    expires_at      TIMESTAMP    NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consumed_at     TIMESTAMP    NULL,

    CONSTRAINT password_reset_surface_chk
        CHECK (surface IN ('INNOVATION', 'CLUB'))
);

CREATE INDEX idx_password_reset_user
    ON password_reset_tokens (surface, user_id);

CREATE INDEX idx_password_reset_expires_at
    ON password_reset_tokens (expires_at);

COMMIT;
