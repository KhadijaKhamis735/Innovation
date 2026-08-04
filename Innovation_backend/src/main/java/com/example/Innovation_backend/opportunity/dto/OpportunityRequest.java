package com.example.Innovation_backend.opportunity.dto;

import com.example.Innovation_backend.opportunity.ApplicationFormType;
import com.example.Innovation_backend.opportunity.OpportunityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/**
 * Body for {@code POST /api/opportunities} and {@code PUT /api/opportunities/{id}}.
 *
 * The funder (owner) is read from the JWT, not from the body. Status is not
 * settable on create/update — it defaults to OPEN and is changed via the
 * dedicated PATCH /api/opportunities/{id}/status endpoint (Phase 5).
 *
 * Phase 5 — persists {@code requirements} (free-form text) and {@code tags}
 * (capped list of short strings). Both UIs (mobile + web) already collect
 * these values; previously they were discarded.
 *
 * Phase 8 — adds {@code applicationFormType} so funders can pick which
 * application form innovators see when they apply. Funder-side sets it via
 * the post-opportunity form's "Application Form Type" dropdown. Defaults to
 * INNOVATION_APPLICATION on the server when the field is omitted, so
 * pre-Phase-8 callers keep working.
 */
public record OpportunityRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String description,
        @NotNull OpportunityType type,
        @Size(max = 100) String amount,
        LocalDate deadline,
        @Size(max = 160) String location,
        @Size(max = 4000) String requirements,
        @Size(max = 20) List<@NotBlank @Size(max = 40) String> tags,
        ApplicationFormType applicationFormType
) {}
