package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.user.dto.UserResponse;

import java.time.Instant;

/**
 * Response of /api/mobile/auth/{register,login,refresh}.
 * <p>
 * Mobile clients store {@code token} as the bearer access JWT and
 * {@code refreshToken} in SecureStore. {@code refreshExpiresAt} lets the
 * client decide when to prompt the user to re-authenticate (e.g. after the
 * refresh token itself has expired). {@code user} is the same
 * {@link UserResponse} that the web {@code /api/auth} endpoints return —
 * a single shape across both clients.
 */
public record MobileAuthResponse(
        String token,
        String refreshToken,
        Instant refreshExpiresAt,
        UserResponse user
) {}