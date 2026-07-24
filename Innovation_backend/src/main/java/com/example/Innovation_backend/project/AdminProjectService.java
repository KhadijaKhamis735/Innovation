package com.example.Innovation_backend.project;

import com.example.Innovation_backend.project.dto.ProjectResponse;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Admin-only operations on INNOVATION-surface projects: list pending queue,
 * approve (auto-assigns a ZSA ID), reject, or override the ZSA ID manually.
 *
 * CLUB-surface projects are intentionally excluded — they have no ZSA approval
 * workflow, and admin tools only need to see INNOVATION rows.
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
        return projectRepo.findAllInnovationByApprovalStatus(status)
                .stream()
                .map(ProjectResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ProjectResponse approve(Long projectId, String adminEmail) {
        mustBeAdmin(adminEmail);
        ProjectEntity p = projectRepo.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        if (p.getSurface() != ProjectSurface.INNOVATION) {
            throw new IllegalArgumentException(
                    "Only innovation projects can be approved; this is " + p.getSurface().json());
        }

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
        ProjectEntity p = projectRepo.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
        if (p.getSurface() != ProjectSurface.INNOVATION) {
            throw new IllegalArgumentException(
                    "Only innovation projects can be rejected; this is " + p.getSurface().json());
        }
        p.setApprovalStatus(ProjectApprovalStatus.REJECTED);
        return ProjectResponse.fromEntity(projectRepo.save(p));
    }

    @Transactional
    public ProjectResponse overrideZsaId(Long projectId, String newZsaId, String adminEmail) {
        mustBeAdmin(adminEmail);
        ProjectEntity p = projectRepo.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
        if (p.getSurface() != ProjectSurface.INNOVATION) {
            throw new IllegalArgumentException(
                    "Only innovation projects have ZSA IDs; this is " + p.getSurface().json());
        }

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
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
        if (u.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Admin role required");
        }
    }
}
