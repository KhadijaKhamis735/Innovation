package com.example.Innovation_backend.project;

import com.example.Innovation_backend.club.ClubAccessChecks;
import com.example.Innovation_backend.club.ClubMember;
import com.example.Innovation_backend.club.MembershipStatus;
import com.example.Innovation_backend.project.dto.MilestoneRequest;
import com.example.Innovation_backend.project.dto.MilestoneResponse;
import com.example.Innovation_backend.project.dto.ProjectResponse;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Milestone add/update/delete for an existing project. The acting user must
 * own the parent project (the polymorphic owner-user check is encoded in
 * {@link MilestoneRepository#findByIdAndProjectOwnerId}).
 */
@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepo;
    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;
    private final ClubAccessChecks clubAccessChecks;

    @Transactional
    public ProjectResponse add(Long projectId, MilestoneRequest req, String email) {
        ProjectEntity project = loadOwned(projectId, email);

        // Defence in depth: the controller also checks this so the
        // service is safe to call from non-HTTP entrypoints (e.g. tests,
        // migrations, future jobs).
        if (req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }

        int nextPos = project.getMilestones().size();
        Milestone m = Milestone.builder()
                .project(project)
                .name(req.name().trim())
                .description(req.description())
                .completed(req.completed())
                .completedDate(req.completedDate())
                .position(req.position() != null ? req.position() : nextPos)
                .build();
        project.addMilestone(milestoneRepo.save(m));
        return ProjectResponse.fromEntity(projectRepo.save(project));
    }

    @Transactional
    public MilestoneResponse update(Long milestoneId, MilestoneRequest req, String email) {
        Long ownerId = resolveOwnerId(email);
        Milestone m = milestoneRepo.findByIdAndProjectOwnerId(milestoneId, ownerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Milestone not found: " + milestoneId));

        if (req.name() != null && !req.name().isBlank()) m.setName(req.name().trim());
        if (req.description() != null) m.setDescription(req.description());

        // Toggle complete: stamp completedDate if flipping to true and none was set.
        boolean wasCompleted = m.isCompleted();
        m.setCompleted(req.completed());
        if (req.completed() && !wasCompleted && m.getCompletedDate() == null) {
            m.setCompletedDate(LocalDate.now());
        }
        if (!req.completed() && wasCompleted) {
            m.setCompletedDate(null);
        }
        if (req.completedDate() != null) m.setCompletedDate(req.completedDate());
        if (req.position() != null) m.setPosition(req.position());

        return MilestoneResponse.fromEntity(milestoneRepo.save(m));
    }

    @Transactional
    public void delete(Long milestoneId, String email) {
        Long ownerId = resolveOwnerId(email);
        Milestone m = milestoneRepo.findByIdAndProjectOwnerId(milestoneId, ownerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Milestone not found: " + milestoneId));
        milestoneRepo.delete(m);
    }

    // ── Internals ───────────────────────────────────────────────────

    private ProjectEntity loadOwned(Long projectId, String email) {
        Long ownerId = resolveOwnerId(email);
        return projectRepo.findById(projectId)
                .filter(p -> {
                    if (p.getSurface() == ProjectSurface.INNOVATION) {
                        return p.getOwnerUser() != null
                                && p.getOwnerUser().getId().equals(ownerId);
                    }
                    if (p.getSurface() == ProjectSurface.CLUB) {
                        return p.getOwnerMember() != null
                                && p.getOwnerMember().getId().equals(ownerId);
                    }
                    return false;
                })
                .orElseThrow(() -> new EntityNotFoundException(
                        "Project not found: " + projectId));
    }

    /**
     * Returns the caller's "owner id" for both surfaces:
     *   - INNOVATOR        → users.id
     *   - CLUB_MEMBER      → club_members.id
     *   - CLUB_LEADER      → club_members.id (leaders are stored in their own table
     *                                         but the owner-of-project check uses
     *                                         the member's id when the surface is CLUB).
     *   - ADMIN            → fails (admins don't author projects from this path).
     */
    private Long resolveOwnerId(String email) {
        String normalised = email.trim().toLowerCase();
        var user = userRepo.findByEmail(normalised);
        if (user.isPresent()) {
            if (user.get().getRole() != Role.INNOVATOR) {
                throw new AccessDeniedException("Only innovators can mutate innovation projects");
            }
            return user.get().getId();
        }
        ClubMember member = clubAccessChecks.currentMember();
        if (member.getStatus() != MembershipStatus.ACTIVE) {
            throw new AccessDeniedException(
                    "Only active club members can mutate projects");
        }
        return member.getId();
    }
}
