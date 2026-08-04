package com.example.Innovation_backend.club.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Body of POST /api/mobile/club/auth/refresh.
 *
 * Mobile clients send the raw refresh token in the JSON body because
 * React Native does not provide a reliable cross-platform cookie jar.
 * Rotation, family-tracking, reuse-detection, and revocation are
 * unchanged from the web flow — only the transport differs.
 */
public record MobileClubRefreshRequest(
        @NotBlank String refreshToken
) {}