package com.example.Innovation_backend.opportunity.dto;

import com.example.Innovation_backend.opportunity.OpportunityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Body for {@code POST /api/opportunities} and {@code PUT /api/opportunities/{id}}.
 *
 * The funder (owner) is read from the JWT, not from the body. Status is not
 * settable on create/update — it defaults to OPEN and is changed via a dedicated
 * PATCH path (added in Phase 3C, or by an admin). For Phase 3B we keep it
 * server-controlled so the public feed's "OPEN only" invariant holds.
 */
public record OpportunityRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String description,
        @NotNull OpportunityType type,
        @Size(max = 100) String amount,
        LocalDate deadline,
        @Size(max = 160) String location
) {}