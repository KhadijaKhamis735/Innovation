package com.example.Innovation_backend.club.dto;

import com.example.Innovation_backend.club.MemberCategory;
import jakarta.validation.constraints.*;

/**
 * Body for {@code POST /api/club/auth/register}.
 *
 * Category-specific fields are validated at the service layer — record-level
 * Bean Validation just enforces presence/format on the always-required fields.
 *
 *   STUDENT    → regNumber     required
 *   STAFF      → staffId       required
 *   ALUMNI     → graduationYear required (1900..current+10)
 *   CORPORATE  → organizationName + organizationRole required
 */
public record ClubRegisterRequest(
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(min = 6, max = 100) String password,
        @NotBlank @Size(max = 160) String fullName,
        @NotNull Long universityId,
        @NotNull MemberCategory category,
        // Optional, category-conditional. Validated in service.
        @Size(max = 64)  String regNumber,
        @Size(max = 64)  String staffId,
        @Min(1900) @Max(2100) Integer graduationYear,
        @Size(max = 200) String organizationName,
        @Size(max = 120) String organizationRole,
        @Size(max = 500) String bio
) {}