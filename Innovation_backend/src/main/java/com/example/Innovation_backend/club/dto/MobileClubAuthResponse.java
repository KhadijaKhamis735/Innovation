package com.example.Innovation_backend.club.dto;

import java.time.Instant;

/**
 * Response of /api/mobile/club/auth/{register,login,refresh}.
 *
 * Mobile clients store {@code token} as the bearer access JWT and
 * {@code refreshToken} in SecureStore — React Native has no reliable
 * cross-platform cookie jar, so the refresh token cannot be HttpOnly.
 * {@code refreshExpiresAt} lets the client decide when to prompt the user
 * to re-authenticate (after the refresh token itself has expired).
 *
 * Exactly one of {@code member} / {@code leader} is populated, mirroring
 * the web {@link ClubAuthResponse} contract. {@code role} and {@code kind}
 * are the JWT-claim string and the uppercase enum value respectively.
 */
public record MobileClubAuthResponse(
        String token,
        String refreshToken,
        Instant refreshExpiresAt,
        String role,                       // "club-member" | "club-leader"
        String kind,                       // "MEMBER" | "LEADER"
        ClubAuthResponse.MemberView member,
        ClubAuthResponse.LeaderView leader
) {}