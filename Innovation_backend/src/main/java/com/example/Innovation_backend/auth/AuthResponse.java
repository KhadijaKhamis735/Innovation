package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.user.dto.UserResponse;

/**
 * Response of /api/auth/login and /api/auth/register.
 * `token` is a JWT. Frontend should store it (e.g. localStorage) and send
 * it back as `Authorization: Bearer <token>` on subsequent requests.
 */
public record AuthResponse(String token, UserResponse user) {}
