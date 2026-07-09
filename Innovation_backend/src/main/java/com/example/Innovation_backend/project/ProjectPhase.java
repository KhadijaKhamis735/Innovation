package com.example.Innovation_backend.project;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Phases an innovator's project can be in. Mirrors the 5 phases used in
 * the React frontend's MyProjects.jsx (idea → proposal → prototype → mvp → scaling).
 *
 * Stored in DB as enum constants; serialized lowercase in JSON.
 * Query-param parsing handled by {@link ProjectPhaseConverter}.
 */
public enum ProjectPhase {
    IDEA,
    PROPOSAL,
    PROTOTYPE,
    MVP,
    SCALING;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ProjectPhase fromJson(String value) {
        return parse(value);
    }

    public static ProjectPhase parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("phase is required");
        }
        try {
            return ProjectPhase.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid phase: '" + value + "'. Allowed: idea, proposal, prototype, mvp, scaling");
        }
    }
}
