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
 * estimatedBudget is OPTIONAL — when null the row simply stores NULL. When
 * provided, it must be > 0. (We allow zero to be invalid; a zero-budget
 * application is almost certainly a mistake.)
 */
public record ApplicationRequest(
        @NotBlank @Size(max = 200) String ideaTitle,
        @NotBlank String problemStatement,
        @NotBlank String proposedSolution,
        @DecimalMin(value = "0.01") BigDecimal estimatedBudget
) {}