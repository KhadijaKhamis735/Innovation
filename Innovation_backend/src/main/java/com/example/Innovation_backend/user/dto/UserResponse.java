package com.example.Innovation_backend.user.dto;

import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;

/**
 * Public user projection. NEVER includes the password.
 * The `role` field serializes lowercase via the Role enum's @JsonValue.
 * The `name` field is the convenience fullName the frontend already uses.
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
        String avatarUrl
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
                u.getAvatarUrl()
        );
    }
}
