package com.example.Innovation_backend.auth;

/**
 * Which client a verification or password-reset email should primary the link
 * for. Presentation only — never persisted, and separate from
 * {@link EmailVerificationToken.Surface}, which names which principal schema
 * the token belongs to.
 */
public enum LinkAudience {
    WEB,
    MOBILE
}
