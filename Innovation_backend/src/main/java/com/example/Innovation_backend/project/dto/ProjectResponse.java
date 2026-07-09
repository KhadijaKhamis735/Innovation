package com.example.Innovation_backend.project.dto;

import com.example.Innovation_backend.project.InnovatorProject;
import com.example.Innovation_backend.project.ProjectApprovalStatus;
import com.example.Innovation_backend.project.ProjectPhase;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Public projection of an {@link InnovatorProject}. Includes nested milestones
 * sorted by position so the frontend can render the same shape as its mock.
 *
 * {@code zsaId} is null until an admin approves the project.
 * {@code approvalStatus} is the admin moderation state.
 */
public record ProjectResponse(
        Long id,
        Long ownerId,
        String zsaId,
        String name,
        String category,
        ProjectPhase phase,
        ProjectApprovalStatus approvalStatus,
        String description,
        LocalDate startDate,
        List<MilestoneResponse> milestones,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProjectResponse fromEntity(InnovatorProject p) {
        List<MilestoneResponse> ms = p.getMilestones().stream()
                .map(MilestoneResponse::fromEntity)
                .toList();
        return new ProjectResponse(
                p.getId(),
                p.getOwner().getId(),
                p.getZsaId(),
                p.getName(),
                p.getCategory(),
                p.getPhase(),
                p.getApprovalStatus(),
                p.getDescription(),
                p.getStartDate(),
                ms,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}