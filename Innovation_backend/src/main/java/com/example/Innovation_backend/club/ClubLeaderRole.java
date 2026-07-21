package com.example.Innovation_backend.club;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * The two executive positions a {@link ClubLeader} can hold. Mapped from the
 * Swahili terms used by the constitution:
 *   MLEZI         — patron / advisor (non-executive)
 *   KAMATI_TENDAJI — committee chair (executive)
 *
 * Multiple leaders can exist in the same club with different roles.
 */
public enum ClubLeaderRole {
    MLEZI,
    KAMATI_TENDAJI;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ClubLeaderRole fromJson(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("leader role is required");
        }
        try {
            return ClubLeaderRole.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid leader role: '" + value + "'. Allowed: mlezi, kamati_tendaji");
        }
    }
}