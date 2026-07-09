package com.example.Innovation_backend.project;

import com.example.Innovation_backend.project.dto.MilestoneRequest;
import com.example.Innovation_backend.project.dto.ProjectRequest;
import com.example.Innovation_backend.project.dto.ProjectResponse;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Business logic for innovator projects. Every mutation checks that the
 * acting user is the project's owner (or throws {@link AccessDeniedException}
 * which the global handler converts to 403).
 *
 * Phase 3A: only INNOVATOR role can hit these endpoints. The role check is
 * done at the controller via {@code @PreAuthorize}; this service still
 * verifies ownership independently so a future Funder/Admin override path
 * can be added without re-plumbing the owner check.
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;

    // ── Reads ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProjectResponse> listMine(String email) {
        User owner = mustInnovator(email);
        return projectRepo.findAllByOwnerIdOrderByCreatedAtDesc(owner.getId())
                .stream()
                .map(ProjectResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getOne(Long id, String email) {
        return ProjectResponse.fromEntity(loadOwned(id, email));
    }

    // ── Mutations ────────────────────────────────────────────────────

    @Transactional
    public ProjectResponse create(ProjectRequest req, String email) {
        User owner = mustInnovator(email);
        InnovatorProject p = InnovatorProject.builder()
                .owner(owner)
                // zsaId is null on create — admin assigns it on approval
                .zsaId(null)
                .approvalStatus(ProjectApprovalStatus.PENDING)
                .name(req.name().trim())
                .category(req.category())
                .phase(req.phase())
                .description(req.description())
                .startDate(req.startDate() != null ? req.startDate() : LocalDate.now())
                .milestones(new ArrayList<>())
                .build();
        applyMilestones(p, req.milestones());
        return ProjectResponse.fromEntity(projectRepo.save(p));
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest req, String email) {
        InnovatorProject p = loadOwned(id, email);
        // Innovator cannot change zsaId or approvalStatus — those are admin-only
        p.setName(req.name().trim());
        p.setCategory(req.category());
        p.setPhase(req.phase());
        p.setDescription(req.description());
        if (req.startDate() != null) p.setStartDate(req.startDate());

        // Replace milestones wholesale (simpler than diff-merge for Phase 3A)
        p.getMilestones().clear();
        applyMilestones(p, req.milestones());
        return ProjectResponse.fromEntity(projectRepo.save(p));
    }

    @Transactional
    public void delete(Long id, String email) {
        InnovatorProject p = loadOwned(id, email);
        projectRepo.delete(p);
    }

    @Transactional
    public ProjectResponse updatePhase(Long id, ProjectPhase phase, String email) {
        InnovatorProject p = loadOwned(id, email);
        p.setPhase(phase);
        return ProjectResponse.fromEntity(projectRepo.save(p));
    }

    // ── Internals ────────────────────────────────────────────────────

    /** Loads a project that belongs to the caller, else 404 or 403. */
    private InnovatorProject loadOwned(Long id, String email) {
        User owner = mustInnovator(email);
        return projectRepo.findByIdAndOwnerId(id, owner.getId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));
    }

    /** Loads the caller, asserts INNOVATOR role. */
    private User mustInnovator(String email) {
        User u = userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        if (u.getRole() != Role.INNOVATOR) {
            throw new AccessDeniedException("Only innovators can access projects");
        }
        return u;
    }

    /** Copies nested milestone DTOs onto the project entity. */
    private void applyMilestones(InnovatorProject p, List<MilestoneRequest> milestones) {
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
}