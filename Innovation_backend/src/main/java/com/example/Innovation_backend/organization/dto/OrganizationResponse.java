package com.example.Innovation_backend.organization.dto;

import com.example.Innovation_backend.organization.Organization;
import com.example.Innovation_backend.organization.OrganizationStatus;

import java.time.Instant;

/**
 * Public projection of an {@link Organization}. Mirrors the fields used by
 * the React frontend's AdminOrganizations mock so the UI can swap seamlessly.
 */
public record OrganizationResponse(
        Long id,
        Long funderId,
        String funderName,
        String funderEmail,
        String name,
        String email,
        String location,
        String type,
        OrganizationStatus status,
        Instant submittedDate,
        Instant updatedAt
) {
    public static OrganizationResponse fromEntity(Organization o) {
        return new OrganizationResponse(
                o.getId(),
                o.getFunder().getId(),
                o.getFunder().getFirstName() + " " + o.getFunder().getLastName(),
                o.getFunder().getEmail(),
                o.getName(),
                o.getEmail(),
                o.getLocation(),
                o.getType(),
                o.getStatus(),
                o.getSubmittedDate(),
                o.getUpdatedAt()
        );
    }
}