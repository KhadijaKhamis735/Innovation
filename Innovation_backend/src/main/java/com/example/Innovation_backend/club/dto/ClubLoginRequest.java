package com.example.Innovation_backend.club.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Body for {@code POST /api/club/auth/login}. Same shape for members and leaders. */
public record ClubLoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {}