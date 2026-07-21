package com.example.Innovation_backend.club;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * The 4 categories of {@link ClubMember}. Each category has its own
 * category-specific fields enforced at registration time:
 *   STUDENT    → regNumber required
 *   STAFF      → staffId required
 *   ALUMNI     → graduationYear required
 *   CORPORATE  → organizationName + organizationRole required
 */
public enum MemberCategory {
    STUDENT,
    STAFF,
    ALUMNI,
    CORPORATE;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static MemberCategory fromJson(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("category is required");
        }
        try {
            return MemberCategory.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid category: '" + value + "'. Allowed: student, staff, alumni, corporate");
        }
    }
}