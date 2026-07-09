package com.example.Innovation_backend.project;

import com.example.Innovation_backend.project.dto.ProjectResponse;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Admin-only operations on innovator projects: list pending queue, approve
 * (auto-assigns a ZSA ID), reject, or override the ZSA ID manually.
 */
@Service
@RequiredArgsConstructor
public class AdminProjectService {

    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;
    private final ZsaIdGenerator zsaIdGenerator;

    @Transactional(readOnly = true)
    public List<ProjectResponse> listByStatus(ProjectApprovalStatus status, String adminEmail) {
        mustBeAdmin(adminEmail);
        return projectRepo.findAllByApprovalStatusOrderByCreatedAtAsc(status)
                .stream()
                .map(ProjectResponse::fromEntity)
                .toList();
    }

    /** Approve a PENDING project and auto-assign the next ZSA ID for the current year. */
    @Transactional
    public ProjectResponse approve(Long projectId, String adminEmail) {
        mustBeAdmin(adminEmail);
        InnovatorProject p = projectRepo.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        if (p.getApprovalStatus() == ProjectApprovalStatus.APPROVED) {
            throw new IllegalArgumentException("Project is already approved");
        }
        if (p.getApprovalStatus() == ProjectApprovalStatus.REJECTED) {
            throw new IllegalArgumentException("Project is rejected; create a new one or reset first");
        }

        // Generate a unique ID; retry a few times if a race produces a duplicate
        String candidate = zsaIdGenerator.nextForCurrentYear();
        for (int i = 0; i < 5 && projectRepo.existsByZsaId(candidate); i++) {
            candidate = zsaIdGenerator.nextForCurrentYear();
        }
        if (projectRepo.existsByZsaId(candidate)) {
            throw new IllegalStateException("Could not generate a unique ZSA ID; please retry");
        }

        p.setZsaId(candidate);
        p.setApprovalStatus(ProjectApprovalStatus.APPROVED);
        return ProjectResponse.fromEntity(projectRepo.save(p));
    }

    @Transactional
    public ProjectResponse reject(Long projectId, String adminEmail) {
        mustBeAdmin(adminEmail);
        InnovatorProject p = projectRepo.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
        p.setApprovalStatus(ProjectApprovalStatus.REJECTED);
        // Keep any zsaId that may have been set previously; admin can clear it via override
        return ProjectResponse.fromEntity(projectRepo.save(p));
    }

    /**
     * Override the ZSA ID manually. Admin can use this to assign a specific ID
     * or clear an existing one (pass empty string to clear).
     */
    @Transactional
    public ProjectResponse overrideZsaId(Long projectId, String newZsaId, String adminEmail) {
        mustBeAdmin(adminEmail);
        InnovatorProject p = projectRepo.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        if (newZsaId == null || newZsaId.isBlank()) {
            p.setZsaId(null);
        } else {
            String trimmed = newZsaId.trim();
            if (projectRepo.existsByZsaId(trimmed) && !trimmed.equals(p.getZsaId())) {
                throw new IllegalArgumentException("ZSA ID already in use: " + trimmed);
            }
            p.setZsaId(trimmed);
        }
        return ProjectResponse.fromEntity(projectRepo.save(p));
    }

    private void mustBeAdmin(String email) {
        User u = userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        if (u.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Admin role required");
        }
    }
}