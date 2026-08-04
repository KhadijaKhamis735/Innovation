package com.example.Innovation_backend.opportunity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Phase 8 — which kind of application form an opportunity exposes to
 * innovators. Funders pick this when posting; the apply flow renders the
 * matching field set.
 *
 *   INNOVATION_APPLICATION — full innovation pitch (Grants, Funding,
 *     Competitions, Prizes). Fields: Idea / Project Title, Problem
 *     Statement, Proposed Solution, Estimated Budget, Current Stage,
 *     Supporting Documents.
 *   PROFILE_APPLICATION — lighter profile-style form (Mentorship,
 *     Training, Bootcamps, Fellowships). Fields: Full Name, Email,
 *     University, Year of Study, Location, Motivation, Hopes to Gain,
 *     Supporting Document (CV / Portfolio).
 *
 * Stored in DB as the enum constant; serialized lowercase in JSON so the
 * web frontend (which uses values like "innovation_application") keeps
 * working without changes.
 */
public enum ApplicationFormType {
    INNOVATION_APPLICATION,
    PROFILE_APPLICATION;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ApplicationFormType fromJson(String value) {
        if (value == null || value.isBlank()) {
            return INNOVATION_APPLICATION;
        }
        try {
            return ApplicationFormType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid applicationFormType: '" + value + "'. Allowed: innovation_application, profile_application");
        }
    }
}
