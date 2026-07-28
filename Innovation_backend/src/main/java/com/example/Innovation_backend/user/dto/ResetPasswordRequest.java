package com.example.Innovation_backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Phase 6C — payload for {@code POST /api/auth/reset-password}.
 *
 * Validation mirrors the register page rules: ≥6 chars, contains a digit.
 * The {@code token} is the raw token from the email link (NOT the hashed
 * value).
 */
public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank
        @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
        @Pattern(regexp = ".*\\d.*", message = "Password must contain at least one digit")
        String password
) {}
