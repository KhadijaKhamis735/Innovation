package com.example.Innovation_backend.project.dto;

import com.example.Innovation_backend.project.ProjectApprovalStatus;
import com.example.Innovation_backend.project.ProjectEntity;
import com.example.Innovation_backend.project.ProjectPhase;
import com.example.Innovation_backend.project.ProjectSurface;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Public projection of a {@link ProjectEntity} — unified shape for both
 * innovation and club projects.
 *
 * Field nullability by surface:
 *   - INNOVATION: zsaId / approvalStatus / ownerUserId / authorName populated;
 *                 ownerMemberId / clubId / clubName / universityId / universityShortName null.
 *   - CLUB:       ownerMemberId / authorName / clubId / clubName / universityId /
 *                 universityShortName / tags populated;
 *                 zsaId / approvalStatus / ownerUserId null.
 */
public record ProjectResponse(
        Long id,
        ProjectSurface surface,
        String name,
        String tagline,
        String description,
        String category,
        ProjectPhase phase,
        List<String> tags,
        LocalDate startDate,

        // Innovation-only fields
        String zsaId,
        ProjectApprovalStatus approvalStatus,

        // Author (one of ownerUserId / ownerMemberId is set)
        Long ownerUserId,
        Long ownerMemberId,
        String authorName,

        // Club-only fields
        Long clubId,
        String clubName,
        Long universityId,
        String universityShortName,

        List<MilestoneResponse> milestones,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProjectResponse fromEntity(ProjectEntity p) {
        List<MilestoneResponse> ms = p.getMilestones().stream()
                .map(MilestoneResponse::fromEntity)
                .toList();

        Long ownerUserId = p.getOwnerUser() == null ? null : p.getOwnerUser().getId();
        Long ownerMemberId = p.getOwnerMember() == null ? null : p.getOwnerMember().getId();
        String authorName = p.getOwnerUser() != null
                ? ((p.getOwnerUser().getFirstName() != null ? p.getOwnerUser().getFirstName() : "")
                    + " " + (p.getOwnerUser().getLastName() != null ? p.getOwnerUser().getLastName() : "")).trim()
                : (p.getOwnerMember() != null ? p.getOwnerMember().getFullName() : null);

        Long clubId = p.getClub() == null ? null : p.getClub().getId();
        String clubName = p.getClub() == null ? null : p.getClub().getName();
        Long universityId = (p.getClub() != null && p.getClub().getUniversity() != null)
                ? p.getClub().getUniversity().getId() : null;
        String universityShortName = (p.getClub() != null && p.getClub().getUniversity() != null)
                ? p.getClub().getUniversity().getShortName() : null;

        return new ProjectResponse(
                p.getId(),
                p.getSurface(),
                p.getName(),
                p.getTagline(),
                p.getDescription(),
                p.getCategory(),
                p.getPhase(),
                p.getTags() == null ? new ArrayList<>() : new ArrayList<>(p.getTags()),
                p.getStartDate(),
                p.getZsaId(),
                p.getApprovalStatus(),
                ownerUserId,
                ownerMemberId,
                authorName,
                clubId,
                clubName,
                universityId,
                universityShortName,
                ms,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
