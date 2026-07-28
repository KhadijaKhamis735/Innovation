-- Phase 6B — email verification on register
--
-- 1. Add `email_verified` boolean to both innovation and club tables.
--    Default true so seeded admin / leader accounts are treated as verified
--    (they were never sent a verification email). Self-registered accounts
--    default to false at the service layer.
--
-- 2. New `email_verification_tokens` table — one row per issued token, hashed
--    (SHA-256 hex). `surface` distinguishes which principal table the token
--    belongs to. 24h expiry. `consumed_at` marks a successful verification.

BEGIN;

-- ── Innovation users ──────────────────────────────────────────────────
ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE;

-- ── Club members ───────────────────────────────────────────────────────
ALTER TABLE club_members
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE;

-- ── Verification tokens ───────────────────────────────────────────────
CREATE TABLE email_verification_tokens (
    id              BIGSERIAL    PRIMARY KEY,
    surface         VARCHAR(16)  NOT NULL,
    user_id         BIGINT       NOT NULL,
    token_hash      VARCHAR(64)  NOT NULL UNIQUE,   -- SHA-256 hex digest
    expires_at      TIMESTAMP    NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consumed_at     TIMESTAMP    NULL,

    CONSTRAINT email_verif_surface_chk
        CHECK (surface IN ('INNOVATION', 'CLUB'))
);

CREATE INDEX idx_email_verif_user
    ON email_verification_tokens (surface, user_id);

CREATE INDEX idx_email_verif_expires_at
    ON email_verification_tokens (expires_at);

COMMIT;
