package com.example.Innovation_backend.user.dto;

import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;

/**
 * Public user projection. NEVER includes the password.
 * The `role` field serializes lowercase via the Role enum's @JsonValue.
 * The `name` field is the convenience fullName the frontend already uses.
 *
 * Phase 7 — extended with notification preference booleans (email/push ×
 * applications/updates/reminders) so the Settings screen can render the
 * current state without a second call + so the PATCH response reflects
 * exactly what was persisted.
 */
public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String name,
        Role role,
        String sector,
        String status,
        String phone,
        String bio,
        String location,
        String avatarUrl,
        boolean emailVerified,
        boolean emailApplications,
        boolean emailUpdates,
        boolean emailReminders,
        boolean pushApplications,
        boolean pushUpdates,
        boolean pushReminders
) {
    public static UserResponse fromEntity(User u) {
        return new UserResponse(
                u.getId(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getFirstName() + " " + u.getLastName(),
                u.getRole(),
                u.getSector(),
                u.getStatus(),
                u.getPhone(),
                u.getBio(),
                u.getLocation(),
                u.getAvatarUrl(),
                u.isEmailVerified(),
                u.isEmailApplications(),
                u.isEmailUpdates(),
                u.isEmailReminders(),
                u.isPushApplications(),
                u.isPushUpdates(),
                u.isPushReminders()
        );
    }
}
