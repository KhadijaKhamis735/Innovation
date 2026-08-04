package com.example.Innovation_backend.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Body for {@code POST /api/opportunities/{id}/apply}.
 *
 * The applicant (innovator) is read from the JWT, not the body. The opportunity
 * is the path variable. Stage defaults to SUBMITTED and isn't settable on create.
 *
 * Phase 8 — dynamic application forms. The opportunity's
 * {@link com.example.Innovation_backend.opportunity.ApplicationFormType}
 * decides which fields are required. The four legacy innovation fields
 * (ideaTitle, problemStatement, proposedSolution, estimatedBudget) stay on
 * the record but are only validated when the opportunity uses the
 * INNOVATION_APPLICATION form. For PROFILE_APPLICATION we only validate
 * the four profile fields. Service layer enforces the right validation
 * per form type.
 *
 * estimatedBudget is OPTIONAL — when null the row simply stores NULL. When
 * provided, it must be > 0. (We allow zero to be invalid; a zero-budget
 * application is almost certainly a mistake.)
 *
 * Phase 9 — {@code projectId} opts into the "apply with an existing
 * approved project" path. When set, the service reads the pitch narrative
 * from the project instead of requiring ideaTitle / problemStatement /
 * proposedSolution in the body, and validates that the project is owned by
 * the caller and carries a ZSA ID. {@code pitchNote} is the accompanying
 * "why this opportunity fits" free text.
 */
public record ApplicationRequest(
        @Size(max = 200) String ideaTitle,
        String problemStatement,
        String proposedSolution,
        @DecimalMin(value = "0.01") BigDecimal estimatedBudget,
        // INNOVATION_APPLICATION extras
        @Size(max = 32) String currentStage,
        @Size(max = 4000) String supportingDocuments,
        // PROFILE_APPLICATION fields
        @Size(max = 200) String fullName,
        @Size(max = 200) String email,
        @Size(max = 200) String university,
        @Size(max = 50) String yearOfStudy,
        @Size(max = 200) String applicantLocation,
        @Size(max = 4000) String motivation,
        @Size(max = 4000) String hopesToGain,
        @Size(max = 4000) String cvLink,
        // Phase 9 — existing-project link
        Long projectId,
        @Size(max = 4000) String pitchNote
) {
    /**
     * Backwards-compatible factory for callers that still post the legacy
     * four innovation fields. The Phase 8 fields default to null and the
     * service layer fills them in based on the opportunity's form type.
     */
    public static ApplicationRequest legacy(
            String ideaTitle, String problemStatement, String proposedSolution,
            BigDecimal estimatedBudget) {
        return new ApplicationRequest(
                ideaTitle, problemStatement, proposedSolution, estimatedBudget,
                null, null, null, null, null, null, null, null, null, null,
                null, null
        );
    }

    /**
     * Build the INNOVATION_APPLICATION payload. The legacy fields are
     * required; the optional supporting documents are passed through.
     */
    public static ApplicationRequest innovation(
            String ideaTitle, String problemStatement, String proposedSolution,
            BigDecimal estimatedBudget, String currentStage, String supportingDocuments) {
        return new ApplicationRequest(
                ideaTitle, problemStatement, proposedSolution, estimatedBudget,
                currentStage, supportingDocuments,
                null, null, null, null, null, null, null, null,
                null, null
        );
    }

    /**
     * Build the PROFILE_APPLICATION payload. The profile fields are required
     * (full name, email, university, year of study, location, motivation,
     * hopes); supporting documents (CV / Portfolio) are optional.
     */
    public static ApplicationRequest profile(
            String fullName, String email, String university, String yearOfStudy,
            String applicantLocation, String motivation, String hopesToGain,
            String cvLink) {
        return new ApplicationRequest(
                null, null, null, null,
                null, cvLink,
                fullName, email, university, yearOfStudy, applicantLocation,
                motivation, hopesToGain, null,
                null, null
        );
    }

    /**
     * Phase 9 — build the "apply with an existing project" payload. The
     * pitch narrative comes from the project itself, so only the budget ask
     * and the fit note are supplied here.
     */
    public static ApplicationRequest existingProject(
            Long projectId, BigDecimal estimatedBudget, String pitchNote) {
        return new ApplicationRequest(
                null, null, null, estimatedBudget,
                null, null,
                null, null, null, null, null, null, null, null,
                projectId, pitchNote
        );
    }
}
