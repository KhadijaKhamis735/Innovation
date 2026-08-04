package com.example.Innovation_backend.project;

import com.example.Innovation_backend.club.Club;
import com.example.Innovation_backend.club.ClubAccessChecks;
import com.example.Innovation_backend.club.ClubMember;
import com.example.Innovation_backend.club.ClubRepository;
import com.example.Innovation_backend.club.MembershipStatus;
import com.example.Innovation_backend.project.attachment.AttachmentKind;
import com.example.Innovation_backend.project.attachment.ProjectAttachment;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentRepository;
import com.example.Innovation_backend.project.attachment.StorageProvider;
import com.example.Innovation_backend.project.dto.MilestoneRequest;
import com.example.Innovation_backend.project.dto.ProjectRequest;
import com.example.Innovation_backend.project.dto.ProjectResponse;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Business logic for the unified {@link ProjectEntity} (Phase 5C-A).
 *
 * The {@code surface} (INNOVATION | CLUB) is derived from the JWT role —
 * never from the request body. This prevents a club member from creating a
 * project that bypasses the admin ZSA approval by claiming to be INNOVATION.
 *
 * Privacy rules (mirrors Phase 5A club project rules):
 *   - INNOVATION rows: open reads for any authenticated user; mutations are
 *     owner-only.
 *   - CLUB rows: same-university access enforced via
 *     {@link ClubAccessChecks#requireSameUniversityOrAdmin(Club)}; mutations
 *     are owner-only.
 *
 * Notify pattern: 404 (not 403) when a caller lacks access — never leak the
 * existence of a project they shouldn't see.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;
    private final ClubRepository clubRepo;
    private final ClubAccessChecks clubAccessChecks;
    private final ProjectAttachmentRepository attachmentRepo;
    private final StorageProvider storage;

    // ── Reads ────────────────────────────────────────────────────────

    /**
     * Returns projects owned by the caller — across both surfaces. The caller
     * is identified by email; if both a User and a ClubMember share the same
     * email (extremely rare), both sets are returned.
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> listMine(String email) {
        Long ownerId = resolveOwnerIdForList(email);
        if (ownerId == null) return List.of();
        return projectRepo.findAllByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(ProjectResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getOne(Long id, String email) {
        return getOne(id, email, null);
    }

    /**
     * Variant that surfaces the project's EVIDENCE attachments. The repository
     * arg is nullable for backwards compatibility with internal callers that
     * don't care (e.g. write-path callers that ignore {@code evidence}).
     */
    @Transactional(readOnly = true)
    public ProjectResponse getOne(Long id, String email,
                                   ProjectAttachmentRepository attachmentRepo) {
        ProjectEntity p = projectRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + id));
        enforceReadVisibility(p, email);
        return ProjectResponse.fromEntity(p, attachmentRepo);
    }

    /**
     * Public branch feed (Phase 5A-style). Same-university access enforced so
     * cross-uni reads return 404.
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> listForBranch(Long clubId) {
        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("Club not found: " + clubId));
        clubAccessChecks.requireSameUniversityOrAdmin(club);
        return projectRepo.findAllByClubIdOrderByCreatedAtDesc(clubId)
                .stream()
                .map(ProjectResponse::fromEntity)
                .toList();
    }

    // ── Mutations ────────────────────────────────────────────────────

    @Transactional
    public ProjectResponse create(ProjectRequest req, String email) {
        CallerIdentity caller = resolveCaller(email);

        if (caller.isInnovator()) {
            User owner = caller.user();
            ProjectEntity p = ProjectEntity.builder()
                    .surface(ProjectSurface.INNOVATION)
                    .ownerUser(owner)
                    .name(req.name().trim())
                    .tagline(trimOrNull(req.tagline()))
                    .description(trimOrNull(req.description()))
                    .category(req.category())
                    .phase(req.phase())
                    .startDate(req.startDate() != null ? req.startDate() : LocalDate.now())
                    .zsaId(null)
                    .approvalStatus(ProjectApprovalStatus.PENDING)
                    .tags(new ArrayList<>())
                    .milestones(new ArrayList<>())
                    .build();
            applyMilestones(p, req.milestones());
            return ProjectResponse.fromEntity(projectRepo.save(p));
        }

        if (caller.isClubMember()) {
            ClubMember member = caller.member();
            if (member.getStatus() != MembershipStatus.ACTIVE) {
                throw new AccessDeniedException(
                        "Only active club members can post projects. Your status is "
                                + member.getStatus().json() + ".");
            }
            ProjectEntity p = ProjectEntity.builder()
                    .surface(ProjectSurface.CLUB)
                    .ownerMember(member)
                    .club(member.getClub())
                    .name(req.name().trim())
                    .tagline(trimOrNull(req.tagline()))
                    .description(trimOrNull(req.description()))
                    .category(req.category() == null || req.category().isBlank()
                            ? "General" : req.category().trim())
                    .phase(req.phase() == null ? ProjectPhase.IDEA : req.phase())
                    .tags(cleanTags(req.tags()))
                    .milestones(new ArrayList<>())
                    .build();
            return ProjectResponse.fromEntity(projectRepo.save(p));
        }

        throw new AccessDeniedException("Unsupported role for project creation");
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest req, String email) {
        ProjectEntity p = loadOwned(id, email);
        p.setName(req.name().trim());
        p.setTagline(trimOrNull(req.tagline()));
        p.setDescription(trimOrNull(req.description()));
        p.setCategory(req.category());
        p.setPhase(req.phase());
        if (req.startDate() != null) p.setStartDate(req.startDate());
        if (p.getSurface() == ProjectSurface.CLUB && req.tags() != null) {
            p.setTags(cleanTags(req.tags()));
        }
        // Innovation projects can't change zsaId/approvalStatus and CLUB projects
        // don't have them — both fields are admin-only.

        // Replace milestones wholesale (only meaningful for INNOVATION projects).
        if (p.getSurface() == ProjectSurface.INNOVATION) {
            p.getMilestones().clear();
            applyMilestones(p, req.milestones());
        }
        return ProjectResponse.fromEntity(projectRepo.save(p));
    }

    @Transactional
    public void delete(Long id, String email) {
        ProjectEntity p = loadOwned(id, email);

        // Capture the storage paths of all attachments BEFORE we delete the
        // project row — FK ON DELETE CASCADE removes the attachment rows in
        // the same statement, so we have to read them first if we want to
        // unlink the files on disk too.
        List<String> pathsToUnlink = new ArrayList<>();
        for (ProjectAttachment att : attachmentRepo.findAllByProjectIdOrderByUploadedAtDesc(id)) {
            pathsToUnlink.add(att.getStoragePath());
        }

        projectRepo.delete(p);

        // Best-effort disk cleanup. We do this AFTER the project delete so
        // any DB rollback leaves the files intact (the attachment rows
        // still exist, pointing at them). On success, files that fail to
        // unlink are logged and left as orphans — a future cleanup pass
        // can reap them.
        for (String path : pathsToUnlink) {
            try {
                storage.delete(path);
            } catch (Exception e) {
                log.warn("Project {} deleted but attachment file {} could not be removed: {}",
                        id, path, e.getMessage());
            }
        }
    }

    /**
     * Move a project to a new phase.
     *
     * Evidence gate: PROTOTYPE and MVP are the phases where a project claims
     * something exists, so they require at least one piece of evidence — an
     * uploaded file or a link — already attached to the project. The remaining
     * phases (IDEA, PROPOSAL, SCALING) are unrestricted.
     *
     * Enforced here rather than only in the UI so the rule also holds for the
     * mobile client and any direct API caller.
     */
    @Transactional
    public ProjectResponse updatePhase(Long id, ProjectPhase phase, String email) {
        ProjectEntity p = loadOwned(id, email);
        requireEvidenceFor(id, phase);
        p.setPhase(phase);
        return ProjectResponse.fromEntity(projectRepo.save(p), attachmentRepo);
    }

    /** Phases that cannot be entered without evidence on the project. */
    private static boolean requiresEvidence(ProjectPhase phase) {
        return phase == ProjectPhase.PROTOTYPE || phase == ProjectPhase.MVP;
    }

    /**
     * @throws IllegalArgumentException (→ HTTP 400) when the target phase needs
     *         evidence and the project has none. The message is user-facing —
     *         the web client renders it verbatim.
     */
    private void requireEvidenceFor(Long projectId, ProjectPhase phase) {
        if (!requiresEvidence(phase)) {
            return;
        }
        long evidenceCount = attachmentRepo.countByProjectIdAndKind(
                projectId, AttachmentKind.EVIDENCE);
        if (evidenceCount == 0) {
            throw new IllegalArgumentException(
                    "Evidence is required to move this project to the "
                            + phase.json() + " stage. Upload a file or add a link first.");
        }
    }

    // ── Internals ───────────────────────────────────────────────────

    private ProjectEntity loadOwned(Long id, String email) {
        ProjectEntity p = projectRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + id));

        if (p.getSurface() == ProjectSurface.INNOVATION) {
            User u = userRepo.findByEmail(email.trim().toLowerCase())
                    .orElseThrow(() -> new AccessDeniedException(
                            "Only the project owner can mutate this project"));
            if (u.getRole() != Role.INNOVATOR
                    || p.getOwnerUser() == null
                    || !p.getOwnerUser().getId().equals(u.getId())) {
                // 404 (not 403) — same convention as the old ClubProjectService.
                throw new EntityNotFoundException("Project not found: " + id);
            }
            return p;
        }

        if (p.getSurface() == ProjectSurface.CLUB) {
            ClubMember member = clubAccessChecks.currentMember();
            if (p.getOwnerMember() == null
                    || !p.getOwnerMember().getId().equals(member.getId())) {
                throw new EntityNotFoundException("Project not found: " + id);
            }
            return p;
        }

        throw new EntityNotFoundException("Project not found: " + id);
    }

    private void enforceReadVisibility(ProjectEntity p, String email) {
        if (p.getSurface() == ProjectSurface.INNOVATION) {
            return; // public to any authenticated user
        }
        if (p.getSurface() == ProjectSurface.CLUB) {
            clubAccessChecks.requireSameUniversityOrAdmin(p.getClub());
            return;
        }
        throw new EntityNotFoundException("Project not found: " + p.getId());
    }

    /**
     * Lightweight caller resolution. Used by {@link #listMine(String)} —
     * returns null if the caller is neither an innovator nor a club member.
     */
    private Long resolveOwnerIdForList(String email) {
        String normalised = email.trim().toLowerCase();
        var user = userRepo.findByEmail(normalised);
        if (user.isPresent() && user.get().getRole() == Role.INNOVATOR) {
            return user.get().getId();
        }
        return clubAccessChecks.currentMemberOpt()
                .map(ClubMember::getId)
                .orElseGet(() -> user.map(User::getId).orElse(null));
    }

    private CallerIdentity resolveCaller(String email) {
        String normalised = email.trim().toLowerCase();
        var user = userRepo.findByEmail(normalised);
        if (user.isPresent()) {
            if (user.get().getRole() == Role.INNOVATOR) {
                return CallerIdentity.innovator(user.get());
            }
            if (user.get().getRole() == Role.ADMIN) {
                throw new AccessDeniedException(
                        "Admins must use the admin project endpoints");
            }
        }
        ClubMember member = clubAccessChecks.currentMember();
        return CallerIdentity.clubMember(member);
    }

    private static String trimOrNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static List<String> cleanTags(List<String> in) {
        if (in == null) return new ArrayList<>();
        List<String> out = new ArrayList<>();
        for (String t : in) {
            if (t != null && !t.isBlank()) out.add(t.trim());
        }
        return out;
    }

    private static void applyMilestones(ProjectEntity p, List<MilestoneRequest> milestones) {
        if (milestones == null) return;
        for (int i = 0; i < milestones.size(); i++) {
            MilestoneRequest mr = milestones.get(i);
            Milestone m = Milestone.builder()
                    .project(p)
                    .name(mr.name().trim())
                    .description(mr.description())
                    .completed(mr.completed())
                    .completedDate(mr.completedDate())
                    .position(mr.position() != null ? mr.position() : i)
                    .build();
            p.addMilestone(m);
        }
    }

    // ── Tiny value type ─────────────────────────────────────────────

    private record CallerIdentity(User user, ClubMember member) {
        static CallerIdentity innovator(User u) { return new CallerIdentity(u, null); }
        static CallerIdentity clubMember(ClubMember m) { return new CallerIdentity(null, m); }
        boolean isInnovator() { return user != null; }
        boolean isClubMember() { return member != null; }
    }
}
