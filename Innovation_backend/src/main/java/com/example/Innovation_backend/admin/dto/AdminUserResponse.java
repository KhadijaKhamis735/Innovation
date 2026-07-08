package com.example.Innovation_backend.admin.dto;

import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;

import java.time.Instant;

/**
 * Admin-facing user DTO. Matches the columns in
 * `../Innovation/src/pages/AdminUsers.jsx`:
 *   id, name, email, location, role (display), joinedDate, status
 *
 * Extra fields (sector, phone, bio) are exposed for the admin detail/edit modal.
 */
public record AdminUserResponse(
        Long id,
        String name,
        String email,
        String location,
        Role role,
        String sector,
        String phone,
        String status,
        Instant joinedDate
) {
    public static AdminUserResponse fromEntity(User u) {
        return new AdminUserResponse(
                u.getId(),
                u.getFirstName() + " " + u.getLastName(),
                u.getEmail(),
                u.getLocation(),
                u.getRole(),
                u.getSector(),
                u.getPhone(),
                u.getStatus(),
                u.getCreatedAt()
        );
    }
}
