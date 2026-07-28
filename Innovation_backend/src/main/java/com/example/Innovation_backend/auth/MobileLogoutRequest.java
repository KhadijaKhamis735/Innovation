package com.example.Innovation_backend.auth;

/**
 * Body of POST /api/mobile/auth/logout.
 * <p>
 * The refresh token is optional so a client with a corrupted store can
 * still request a logout (server-side this is a no-op for an unknown
 * token, but the response is still 204 — never leaks whether the token
 * existed).
 */
public record MobileLogoutRequest(
        String refreshToken
) {}