package com.example.Innovation_backend.club;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * A {@link Club} (branch) lifecycle. ACTIVE branches appear in public listings;
 * INACTIVE ones are hidden but data is preserved.
 */
public enum ClubStatus {
    ACTIVE,
    INACTIVE;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ClubStatus fromJson(String value) {
        if (value == null || value.isBlank()) {
            return ACTIVE; // default for callers that omit it
        }
        try {
            return ClubStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid club status: '" + value + "'. Allowed: active, inactive");
        }
    }
}