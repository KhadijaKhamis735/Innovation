package com.example.Innovation_backend.admin;

import com.example.Innovation_backend.admin.dto.AdminUserResponse;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only endpoints. All methods require ROLE_ADMIN.
 *
 * Use {@code @PreAuthorize("hasRole('ADMIN')")} on each method — cleaner than
 * scattering URL rules across SecurityConfig.
 *
 * Endpoints:
 *   GET    /api/admin/users              → list every user
 *   GET    /api/admin/stats              → simple counts
 *   PATCH  /api/admin/users/{id}/status  → activate / deactivate
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;

    /** List every user. Order: most recent first. */
    @GetMapping("/users")
    @Transactional(readOnly = true)
    public List<AdminUserResponse> listUsers() {
        return userRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(AdminUserResponse::fromEntity)
                .toList();
    }

    /** Aggregate counts for the admin dashboard. */
    @GetMapping("/stats")
    @Transactional(readOnly = true)
    public Map<String, Object> stats() {
        long total = userRepository.count();
        long innovators = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.example.Innovation_backend.user.Role.INNOVATOR).count();
        long funders = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.example.Innovation_backend.user.Role.FUNDER).count();
        long admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.example.Innovation_backend.user.Role.ADMIN).count();
        long active = userRepository.findAll().stream()
                .filter(u -> "active".equals(u.getStatus())).count();
        long inactive = total - active;

        return Map.of(
                "totalUsers", total,
                "byRole", Map.of(
                        "innovator", innovators,
                        "funder", funders,
                        "admin", admins
                ),
                "byStatus", Map.of(
                        "active", active,
                        "inactive", inactive
                )
        );
    }

    /** Toggle a user's active/inactive status. */
    @PatchMapping("/users/{id}/status")
    @Transactional
    public AdminUserResponse updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.getOrDefault("status", "active");
        if (!newStatus.equals("active") && !newStatus.equals("inactive")) {
            throw new IllegalArgumentException("status must be 'active' or 'inactive'");
        }

        User u = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        u.setStatus(newStatus);
        return AdminUserResponse.fromEntity(userRepository.save(u));
    }
}
