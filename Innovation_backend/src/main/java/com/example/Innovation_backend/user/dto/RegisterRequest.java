package com.example.Innovation_backend.user.dto;

import com.example.Innovation_backend.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Payload accepted by POST /api/auth/register.
 * Validation matches the rules enforced by RegisterPage.jsx:
 *   - password ≥ 6 chars
 *   - password must contain at least one digit
 *   - email is well-formed
 *   - firstName/lastName non-blank
 *   - sector is required iff role=FUNDER
 */
public record RegisterRequest(
        @NotBlank @Email String email,

        @NotBlank
        @Size(min = 6, max = 64, message = "password must be 6-64 characters")
        @Pattern(regexp = ".*\\d.*", message = "password must contain at least one digit")
        String password,

        @NotNull Role role,

        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,

        @Size(max = 80) String sector
) {}
