package com.example.Innovation_backend.project;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Approval status of an innovator's project. Admin moderates this:
 * - PENDING  — created by innovator, awaiting admin review
 * - APPROVED — admin assigned a ZSA ID, project is officially tracked
 * - REJECTED — admin denied (e.g. duplicate, ineligible, etc.)
 *
 * Default for new projects is PENDING. The {@code zsaId} field is null until
 * the project is APPROVED.
 *
 * Parses lowercase AND uppercase from both JSON bodies (via @JsonCreator)
 * and @RequestParam query strings (see {@link ProjectApprovalStatusConverter}).
 */
public enum ProjectApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ProjectApprovalStatus fromJson(String value) {
        return parse(value);
    }

    public static ProjectApprovalStatus parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("approvalStatus is required");
        }
        try {
            return ProjectApprovalStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid approvalStatus: '" + value + "'. Allowed: pending, approved, rejected");
        }
    }
}