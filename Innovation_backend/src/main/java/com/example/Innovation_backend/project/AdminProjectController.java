package com.example.Innovation_backend.project;

import com.example.Innovation_backend.project.dto.ProjectResponse;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin endpoints for moderating innovator projects. Routes require role=ADMIN.
 * Uses per-method @PreAuthorize (class-level caused NPE) and reads principal
 * directly from SecurityContextHolder for the same reason.
 */
@RestController
@RequestMapping("/api/admin/projects")
@RequiredArgsConstructor
public class AdminProjectController {

    private final AdminProjectService adminProjectService;

    /** List projects by approval status (e.g. ?status=pending for the admin queue). */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ProjectResponse> listByStatus(
            @RequestParam(name = "status", defaultValue = "PENDING") ProjectApprovalStatus status) {
        return adminProjectService.listByStatus(status, currentEmail());
    }

    /** Approve a PENDING project. Backend auto-assigns the next ZSA ID. */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ProjectResponse approve(@PathVariable Long id) {
        return adminProjectService.approve(id, currentEmail());
    }

    /** Reject a PENDING project. */
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ProjectResponse reject(@PathVariable Long id) {
        return adminProjectService.reject(id, currentEmail());
    }

    /** Override the ZSA ID. Pass empty string to clear. */
    @PatchMapping("/{id}/zsa-id")
    @PreAuthorize("hasRole('ADMIN')")
    public ProjectResponse overrideZsaId(
            @PathVariable Long id,
            @RequestBody ZsaIdOverrideRequest body) {
        return adminProjectService.overrideZsaId(id, body.zsaId(), currentEmail());
    }

    public record ZsaIdOverrideRequest(
            @Size(max = 64) String zsaId   // null/blank = clear
    ) {}

    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("No authenticated principal in SecurityContext");
        }
        return auth.getName();
    }
}