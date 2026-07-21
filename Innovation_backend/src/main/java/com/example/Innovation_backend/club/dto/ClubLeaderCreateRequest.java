package com.example.Innovation_backend.club.dto;

import com.example.Innovation_backend.club.ClubLeaderRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Body for {@code POST /api/admin/club-leaders} (admin-only).
 *
 * Same shape as ClubRegisterRequest minus the member-specific category
 * fields — leaders don't have a member category, just a leadership role.
 */
public record ClubLeaderCreateRequest(
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(min = 6, max = 100) String password,
        @NotBlank @Size(max = 160) String fullName,
        @NotNull Long universityId,
        @NotNull ClubLeaderRole role,
        @Size(max = 32) String phone
) {}