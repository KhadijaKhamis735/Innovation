package com.example.Innovation_backend.club.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Body for {@code POST /api/admin/clubs} (admin-only).
 *
 * Only {@code name} and {@code universityId} are required — everything
 * else is optional metadata that can be added later via a PATCH endpoint.
 */
public record ClubCreateRequest(
        @NotBlank @Size(max = 200) String name,
        @NotNull Long universityId,
        Long patronId,
        @Size(max = 120) String campus,
        @Size(max = 300) String address,
        LocalDate foundedAt,
        LocalDate charterSignedAt
) {}