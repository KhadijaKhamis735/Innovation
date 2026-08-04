package com.example.Innovation_backend.opportunity.dto;

import com.example.Innovation_backend.opportunity.ApplicationFormType;
import com.example.Innovation_backend.opportunity.Opportunity;
import com.example.Innovation_backend.opportunity.OpportunityStatus;
import com.example.Innovation_backend.opportunity.OpportunityType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Public projection of an {@link com.example.Innovation_backend.opportunity.Opportunity}.
 * Includes the funder's display name + organization name so the React frontend's
 * opportunity cards can render without a second round-trip.
 *
 * Built via the factory so the service layer can supply the (possibly null)
 * organization name without forcing lazy-loading inside the DTO.
 *
 * Phase 5 — adds {@code requirements}, {@code tags} (both previously discarded
 * by the create/update paths), and {@code applicantCount} (number of
 * applications submitted to this opportunity — only meaningful on owner-scoped
 * reads; public reads return 0).
 *
 * Phase 8 — adds {@code applicationFormType} so the apply form can render
 * the right field set per opportunity. Defaults to INNOVATION_APPLICATION
 * on the entity, so legacy rows without the column on the read side never
 * need a migration backfill here.
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
        String requirements,
        List<String> tags,
        ApplicationFormType applicationFormType,
        long applicantCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static OpportunityResponse fromEntity(Opportunity o, String funderOrganizationName) {
        return fromEntity(o, funderOrganizationName, 0L);
    }

    public static OpportunityResponse fromEntity(Opportunity o, String funderOrganizationName, long applicantCount) {
        // Defensive copy — the JSONB list comes from Hibernate and may be the
        // underlying PersistentBag; serialise via an immutable ArrayList so
        // downstream Jackson never touches a mutable proxy.
        List<String> safeTags = (o.getTags() == null)
                ? new ArrayList<>()
                : new ArrayList<>(o.getTags());
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
                o.getRequirements(),
                safeTags,
                o.getApplicationFormType() == null
                        ? ApplicationFormType.INNOVATION_APPLICATION
                        : o.getApplicationFormType(),
                applicantCount,
                o.getCreatedAt(),
                o.getUpdatedAt()
        );
    }
}