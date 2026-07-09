package com.example.Innovation_backend.project;

import com.example.Innovation_backend.project.dto.MilestoneRequest;
import com.example.Innovation_backend.project.dto.MilestoneResponse;
import com.example.Innovation_backend.project.dto.ProjectResponse;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Milestone add/update/delete for an existing project. The acting user must
 * own the parent project (owner-check via {@link MilestoneRepository#findByIdAndProjectOwnerId}).
 */
@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepo;
    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;

    @Transactional
    public ProjectResponse add(Long projectId, MilestoneRequest req, String email) {
        User owner = mustInnovator(email);
        InnovatorProject project = projectRepo.findByIdAndOwnerId(projectId, owner.getId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

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
        User owner = mustInnovator(email);
        Milestone m = milestoneRepo.findByIdAndProjectOwnerId(milestoneId, owner.getId())
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));

        if (req.name() != null && !req.name().isBlank()) m.setName(req.name().trim());
        if (req.description() != null) m.setDescription(req.description());

        // Toggle complete: stamp completedDate if flipping to true and none was set.
        boolean wasCompleted = m.isCompleted();
        m.setCompleted(req.completed());
        if (req.completed() && !wasCompleted && m.getCompletedDate() == null) {
            m.setCompletedDate(LocalDate.now());
        }
        if (!req.completed() && wasCompleted) {
            // Unchecking clears the recorded completion date
            m.setCompletedDate(null);
        }
        if (req.completedDate() != null) m.setCompletedDate(req.completedDate());
        if (req.position() != null) m.setPosition(req.position());

        return MilestoneResponse.fromEntity(milestoneRepo.save(m));
    }

    @Transactional
    public void delete(Long milestoneId, String email) {
        User owner = mustInnovator(email);
        Milestone m = milestoneRepo.findByIdAndProjectOwnerId(milestoneId, owner.getId())
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found: " + milestoneId));
        milestoneRepo.delete(m);
    }

    private User mustInnovator(String email) {
        User u = userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        if (u.getRole() != Role.INNOVATOR) {
            throw new AccessDeniedException("Only innovators can access projects");
        }
        return u;
    }
}