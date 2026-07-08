package com.example.Innovation_backend.user;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Roles for the Innovation surface (frontend AuthContext).
 *
 * Stored in DB as enum constants (e.g. INNOVATOR); serialized as lowercase
 * strings in JSON so the existing React frontend keeps working without changes:
 *   - INNOVATOR ↔ "innovator"
 *   - FUNDER    ↔ "funder"
 *   - ADMIN     ↔ "admin"
 *
 * Club roles (CLUB_MEMBER, CLUB_LEADER) live in com.example.Innovation_backend.club.ClubRole
 * and are part of a separate auth surface.
 */
public enum Role {
    INNOVATOR,
    FUNDER,
    ADMIN;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    /** Accepts both "innovator" and "INNOVATOR" from request bodies. */
    @JsonCreator
    public static Role fromJson(String value) {
        if (value == null) {
            throw new IllegalArgumentException("role is required");
        }
        try {
            return Role.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid role: '" + value + "'. Allowed: innovator, funder, admin");
        }
    }
}
