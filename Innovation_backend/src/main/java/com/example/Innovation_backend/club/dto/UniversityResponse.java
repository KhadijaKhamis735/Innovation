package com.example.Innovation_backend.club.dto;

import com.example.Innovation_backend.club.University;

/**
 * Public-facing projection of a {@link University} for the mobile register
 * picker (and any other read-only consumer).
 *
 * Returned by GET /api/club/auth/universities. Lives under /api/club/auth/**
 * so it inherits the existing {@code permitAll} block in SecurityConfig —
 * no security wiring change needed for Phase 7 Slice A1.
 *
 * Auto-generated IDs are not deterministic across fresh databases, so the
 * mobile client must always look up {@code id} from this endpoint rather
 * than hard-coding it.
 */
public record UniversityResponse(
        Long id,
        String name,
        String shortName,
        String regNumberPrefix,
        String primaryColor,
        String tagline
) {
    public static UniversityResponse from(University u) {
        return new UniversityResponse(
                u.getId(),
                u.getName(),
                u.getShortName(),
                u.getRegNumberPrefix(),
                u.getPrimaryColor(),
                u.getTagline()
        );
    }
}