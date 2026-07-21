package com.example.Innovation_backend.opportunity.dto;

import com.example.Innovation_backend.opportunity.Opportunity;
import com.example.Innovation_backend.opportunity.OpportunityStatus;
import com.example.Innovation_backend.opportunity.OpportunityType;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Public projection of an {@link com.example.Innovation_backend.opportunity.Opportunity}.
 * Includes the funder's display name + organization name so the React frontend's
 * opportunity cards can render without a second round-trip.
 *
 * Built via the two-argument factory so the service layer can supply the
 * (possibly null) organization name without forcing lazy-loading inside the DTO.
 */
public record OpportunityResponse(
        Long id,
        Long funderId,
        String funderName,
        String funderOrganizationName,
        String title,
        String description,
        OpportunityType type,
        OpportunityStatus status,
        String amount,
        LocalDate deadline,
        String location,
        Instant createdAt,
        Instant updatedAt
) {
    public static OpportunityResponse fromEntity(Opportunity o, String funderOrganizationName) {
        return new OpportunityResponse(
                o.getId(),
                o.getFunder().getId(),
                o.getFunder().getFirstName() + " " + o.getFunder().getLastName(),
                funderOrganizationName,
                o.getTitle(),
                o.getDescription(),
                o.getType(),
                o.getStatus(),
                o.getAmount(),
                o.getDeadline(),
                o.getLocation(),
                o.getCreatedAt(),
                o.getUpdatedAt()
        );
    }
}