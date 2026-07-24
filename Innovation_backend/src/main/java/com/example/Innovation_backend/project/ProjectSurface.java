package com.example.Innovation_backend.project;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Discriminator for a {@link ProjectEntity} row. Lets the same table serve
 * both the Innovation surface (User-authored projects with ZSA-approval
 * workflow) and the Club surface (ClubMember-authored projects scoped to
 * a branch). The DB enforces a CHECK constraint that exactly one of the
 * two foreign keys is populated.
 *
 *  - {@code INNOVATION}: project owned by an innovator (User); goes through
 *    admin ZSA approval; rendered in the public Innovation Hub.
 *  - {@code CLUB}: project owned by an active club member; scoped to the
 *    member's branch/university; rendered in the branch detail feed.
 *
 * Lowercase JSON convention matches {@link ProjectPhase} and
 * {@link ProjectApprovalStatus}.
 */
public enum ProjectSurface {
    INNOVATION,
    CLUB;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ProjectSurface fromJson(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("surface is required");
        }
        try {
            return ProjectSurface.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid surface: '" + value + "'. Allowed: innovation, club");
        }
    }
}
