package com.example.Innovation_backend.club.election;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Why a {@link ClubExecutive} holds their seat.
 *
 *   ELECTION     — installed via a normal closed election where a previous holder existed
 *   APPOINTMENT  — placed by Patron/Chair without an election (e.g. interim, handover)
 *   BY_ELECTION  — installed via an election that started while the seat was vacant
 *
 * JSON form: lowercase enum name (e.g. "election", "by_election"). Note:
 * by_election has an underscore in storage to match the frontend's
 * `electedBy: 'by-election'` kebab-case. We convert at the boundary if needed.
 */
public enum ExecutiveSource {
    ELECTION,
    APPOINTMENT,
    BY_ELECTION;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ExecutiveSource fromJson(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("source is required");
        }
        String normalized = value.trim().toLowerCase().replace('-', '_');
        try {
            return ExecutiveSource.valueOf(normalized.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid source: '" + value + "'. Allowed: election, appointment, by_election");
        }
    }
}
