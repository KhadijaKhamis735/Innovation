package com.example.Innovation_backend.organization.dto;

import com.example.Innovation_backend.organization.OrganizationStatus;
import jakarta.validation.constraints.NotNull;

/** Body for {@code PATCH /api/admin/organizations/{id}/status}. */
public record OrganizationStatusRequest(
        @NotNull OrganizationStatus status
) {}