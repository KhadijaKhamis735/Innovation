package com.example.Innovation_backend.application.dto;

import com.example.Innovation_backend.application.Application;
import com.example.Innovation_backend.application.ApplicationStage;
import com.example.Innovation_backend.project.ProjectApprovalStatus;
import com.example.Innovation_backend.project.ProjectEntity;
import com.example.Innovation_backend.project.ProjectPhase;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Public projection of an {@link Application}.
 *
 * Includes the opportunity's title + funder name so the "My Applications" view
 * can render without a second round-trip. Includes the innovator's name so the
 * "Received Applications" (funder) view can render applicant cards.
 *
 * Built via the two-argument factory so the service can supply both projections
 * without forcing lazy-loading inside the DTO.
 *
 * Phase 8 — exposes the dynamic application-form fields so the funder's
 * Received Applications view can show the right fields for both
 * INNOVATION_APPLICATION and PROFILE_APPLICATION rows. Legacy four-column
 * fields stay at the top of the record for backward compatibility.
 *
 * Phase 9 — exposes the linked project ({@link #linkedProject}) when the
 * innovator applied with an existing approved project. The project block is
 * resolved LIVE from the project row, not from the application's snapshot
 * columns, so a stage change or new evidence the innovator adds after
 * submitting is immediately visible to the funder. It is {@code null} for
 * new-idea applications.
 */
public record ApplicationResponse(
        Long id,
        Long opportunityId,
        String opportunityTitle,
        Long innovatorId,
        String innovatorName,
        String innovatorEmail,
        // Legacy / INNOVATION_APPLICATION fields
        String ideaTitle,
        String problemStatement,
        String proposedSolution,
        BigDecimal estimatedBudget,
        // INNOVATION_APPLICATION extras
        String currentStage,
        String supportingDocuments,
        // PROFILE_APPLICATION fields
        String fullName,
        String email,
        String university,
        String yearOfStudy,
        String applicantLocation,
        String motivation,
        String hopesToGain,
        String cvLink,
        // Phase 9 — existing-project link
        Long projectId,
        String pitchNote,
        LinkedProject linkedProject,
        // Stage + timestamps
        ApplicationStage stage,
        Instant appliedAt,
        Instant updatedAt
) {

    /**
     * Live snapshot of the tracked project an application is linked to.
     *
     * <p>Everything here is read from the {@link ProjectEntity} at response
     * time. {@code otherFundingCount} is the number of OTHER applications for
     * the same project that a funder has already ACCEPTED — surfaced purely
     * for transparency. It never blocks an application: a project may receive
     * support from multiple funders by design.
     */
    public record LinkedProject(
            Long id,
            String zsaId,
            String name,
            String tagline,
            String description,
            String category,
            ProjectPhase phase,
            ProjectApprovalStatus approvalStatus,
            List<ProjectAttachmentResponse> evidence,
            int otherFundingCount,
            List<String> otherFunders
    ) {}

    /**
     * New-idea path (and every legacy caller) — no linked project.
     */
    public static ApplicationResponse fromEntity(
            Application a,
            String opportunityTitle,
            String innovatorName,
            String innovatorEmail
    ) {
        return fromEntity(a, opportunityTitle, innovatorName, innovatorEmail, null);
    }

    /**
     * Existing-project path — {@code linkedProject} is built by the service
     * (which owns the attachment + funding-transparency lookups) and passed
     * in here. Passing {@code null} is equivalent to the 4-arg overload.
     */
    public static ApplicationResponse fromEntity(
            Application a,
            String opportunityTitle,
            String innovatorName,
            String innovatorEmail,
            LinkedProject linkedProject
    ) {
        return new ApplicationResponse(
                a.getId(),
                a.getOpportunity().getId(),
                opportunityTitle,
                a.getInnovator().getId(),
                innovatorName,
                innovatorEmail,
                a.getIdeaTitle(),
                a.getProblemStatement(),
                a.getProposedSolution(),
                a.getEstimatedBudget(),
                a.getCurrentStage(),
                a.getSupportingDocuments(),
                a.getFullName(),
                a.getEmail(),
                a.getUniversity(),
                a.getYearOfStudy(),
                a.getApplicantLocation(),
                a.getMotivation(),
                a.getHopesToGain(),
                a.getCvLink(),
                linkedProject == null ? null : linkedProject.id(),
                a.getPitchNote(),
                linkedProject,
                a.getStage(),
                a.getAppliedAt(),
                a.getUpdatedAt()
        );
    }
}
