package com.example.Innovation_backend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Email-bodied resend-verification request for the mobile surface, where the
 * caller often has no session because {@code signUp} discards the register
 * response tokens. Kept separate from {@link ForgotPasswordRequest} so the
 * two flows can diverge later (e.g. captcha on one but not the other).
 */
public record ResendVerificationRequest(
        @NotBlank @Email String email
) {}
