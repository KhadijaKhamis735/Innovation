package com.example.Innovation_backend.application.dto;

import com.example.Innovation_backend.application.Application;
import com.example.Innovation_backend.application.ApplicationStage;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Public projection of an {@link Application}.
 *
 * Includes the opportunity's title + funder name so the "My Applications" view
 * can render without a second round-trip. Includes the innovator's name so the
 * "Received Applications" (funder) view can render applicant cards.
 *
 * Built via the two-argument factory so the service can supply both projections
 * without forcing lazy-loading inside the DTO.
 */
public record ApplicationResponse(
        Long id,
        Long opportunityId,
        String opportunityTitle,
        Long innovatorId,
        String innovatorName,
        String innovatorEmail,
        String ideaTitle,
        String problemStatement,
        String proposedSolution,
        BigDecimal estimatedBudget,
        ApplicationStage stage,
        Instant appliedAt,
        Instant updatedAt
) {
    public static ApplicationResponse fromEntity(
            Application a,
            String opportunityTitle,
            String innovatorName,
            String innovatorEmail
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
                a.getStage(),
                a.getAppliedAt(),
                a.getUpdatedAt()
        );
    }
}