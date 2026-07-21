package com.example.Innovation_backend.club.election;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * The 7 Executive Committee (Kamati Tendaji) positions per IBARA YA 19.
 *
 * Vocabulary matches the frontend's
 * {@code Innovation/src/club/data/executivePositions.js} — the frontend ids
 * (e.g. "chair", "vice_chair") are NOT 1:1 with this enum's name (CHAIR,
 * VICE_CHAIR), but we serialize with the frontend's snake_case ids via
 * {@link #id()} for cross-language stability.
 *
 * JSON form (wire + repository storage):
 *   chair, vice_chair, secretary, treasurer, programs_officer,
 *   innovation_officer, communications_officer
 */
public enum ExecutivePosition {
    CHAIR("chair"),
    VICE_CHAIR("vice_chair"),
    SECRETARY("secretary"),
    TREASURER("treasurer"),
    PROGRAMS_OFFICER("programs_officer"),
    INNOVATION_OFFICER("innovation_officer"),
    COMMUNICATIONS_OFFICER("communications_officer");

    private final String id;

    ExecutivePosition(String id) {
        this.id = id;
    }

    /** Frontend-stable identifier (snake_case). Used on the JSON wire + DB. */
    public String id() {
        return id;
    }

    @JsonValue
    public String json() {
        return id;
    }

    @JsonCreator
    public static ExecutivePosition fromJson(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("position is required");
        }
        String v = value.trim().toLowerCase();
        for (ExecutivePosition p : values()) {
            if (p.id.equals(v) || p.name().equalsIgnoreCase(v)) return p;
        }
        throw new IllegalArgumentException(
                "Invalid position: '" + value + "'. Allowed: chair, vice_chair, secretary, treasurer, programs_officer, innovation_officer, communications_officer");
    }
}
