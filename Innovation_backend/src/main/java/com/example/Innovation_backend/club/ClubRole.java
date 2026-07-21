package com.example.Innovation_backend.club;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Role of a club-domain principal. Persisted as the enum constant; serialized
 * to JSON as the lowercase string so it matches the AuthContext.ROLE_HOME map
 * on the frontend (see IMPLEMENTATION_PLAN §2 — "Note").
 *
 * Used in JWT claims via {@code JwtService.issue(email, id, "club-member")}.
 * Spring maps this to {@code ROLE_CLUB_MEMBER} / {@code ROLE_CLUB_LEADER}
 * automatically in JwtAuthFilter.
 */
public enum ClubRole {
    CLUB_MEMBER,
    CLUB_LEADER;

    @JsonValue
    public String json() {
        return name().toLowerCase().replace('_', '-');
    }

    @JsonCreator
    public static ClubRole fromJson(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("club role is required");
        }
        String normalized = value.trim().toLowerCase().replace('-', '_');
        try {
            return ClubRole.valueOf(normalized.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid club role: '" + value + "'. Allowed: club-member, club-leader");
        }
    }
}