package com.example.Innovation_backend.project.dto;

import com.example.Innovation_backend.project.ProjectApprovalStatus;
import com.example.Innovation_backend.project.ProjectEntity;
import com.example.Innovation_backend.project.ProjectPhase;
import com.example.Innovation_backend.project.ProjectSurface;
import com.example.Innovation_backend.project.attachment.AttachmentKind;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentRepository;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentResponse;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
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
 *
 * Evidence: the {@code evidence} list carries the project's
 * {@link AttachmentKind#EVIDENCE} attachments in uploaded-at ascending order.
 * Two {@link #fromEntity(ProjectEntity)} overloads — the single-arg one returns
 * an empty {@code evidence} list (use it on write paths to avoid an extra
 * round-trip), the two-arg overload fetches via
 * {@link ProjectAttachmentRepository} and is used by every read path so Admin
 * (and Innovator detail) actually sees the evidence.
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
        List<ProjectAttachmentResponse> evidence,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Write-path overload — returns an empty evidence list. Use on
     * {@code create} / {@code update} so we don't issue an extra SELECT per
     * mutation; the client reloads the detail after each write.
     */
    public static ProjectResponse fromEntity(ProjectEntity p) {
        return fromEntity(p, null);
    }

    /**
     * Read-path overload — pass a {@link ProjectAttachmentRepository} (or
     * {@code null} for the empty list) to populate {@code evidence} with the
     * project's {@link AttachmentKind#EVIDENCE} attachments, oldest first.
     */
    public static ProjectResponse fromEntity(ProjectEntity p,
                                             ProjectAttachmentRepository attachmentRepo) {
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

        List<ProjectAttachmentResponse> evidence = loadEvidence(p, attachmentRepo);

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
                evidence,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }

    /**
     * Pull the EVIDENCE-kind attachments for the project, oldest first. Returns
     * an empty list if no repository is supplied (write path) or there are no
     * rows. CLUB-surface projects go through this too — but admins don't list
     * CLUB projects, so the result is effectively ignored there.
     */
    private static List<ProjectAttachmentResponse> loadEvidence(ProjectEntity p,
                                                                ProjectAttachmentRepository repo) {
        if (repo == null || p.getId() == null) {
            return List.of();
        }
        return repo.findAllByProjectIdOrderByUploadedAtDesc(p.getId()).stream()
                .filter(a -> a.getKind() == AttachmentKind.EVIDENCE)
                // DTO field name is "evidence" — surface chronologically so the
                // admin/mobile UI reads the timeline top-down.
                .sorted(Comparator.comparing(a ->
                        a.getUploadedAt() != null ? a.getUploadedAt() : java.time.Instant.EPOCH))
                .map(ProjectAttachmentResponse::fromEntity)
                .toList();
    }
}
