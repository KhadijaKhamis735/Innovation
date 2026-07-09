package com.example.Innovation_backend.project;

import com.example.Innovation_backend.project.dto.MilestoneRequest;
import com.example.Innovation_backend.project.dto.MilestoneResponse;
import com.example.Innovation_backend.project.dto.ProjectRequest;
import com.example.Innovation_backend.project.dto.ProjectResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * Phase 3A endpoints for innovator projects. All routes require JWT and the
 * INNOVATOR role (enforced per-method via {@code @PreAuthorize} — class-level
 * was tried but caused a NullPointerException on @AuthenticationPrincipal lookup
 * during initial calls).
 *
 * The acting user's email is read via SecurityContextHolder rather than
 * @AuthenticationPrincipal, because that combination with @PreAuthorize at the
 * class level wasn't reliable.
 */
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final MilestoneService milestoneService;

    // ── Project CRUD ────────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("hasRole('INNOVATOR')")
    public List<ProjectResponse> listMine() {
        return projectService.listMine(currentEmail());
    }

    @PostMapping
    @PreAuthorize("hasRole('INNOVATOR')")
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectRequest req) {
        ProjectResponse created = projectService.create(req, currentEmail());
        return ResponseEntity.created(URI.create("/api/projects/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('INNOVATOR')")
    public ProjectResponse getOne(@PathVariable Long id) {
        return projectService.getOne(id, currentEmail());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('INNOVATOR')")
    public ProjectResponse update(@PathVariable Long id,
                                  @Valid @RequestBody ProjectRequest req) {
        return projectService.update(id, req, currentEmail());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INNOVATOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        projectService.delete(id, currentEmail());
    }

    @PatchMapping("/{id}/phase")
    @PreAuthorize("hasRole('INNOVATOR')")
    public ProjectResponse updatePhase(@PathVariable Long id,
                                       @RequestParam ProjectPhase phase) {
        return projectService.updatePhase(id, phase, currentEmail());
    }

    // ── Milestones ──────────────────────────────────────────────────

    @PostMapping("/{id}/milestones")
    @PreAuthorize("hasRole('INNOVATOR')")
    public ProjectResponse addMilestone(@PathVariable Long id,
                                        @Valid @RequestBody MilestoneRequest req) {
        return milestoneService.add(id, req, currentEmail());
    }

    @PatchMapping("/{id}/milestones/{mid}")
    @PreAuthorize("hasRole('INNOVATOR')")
    public MilestoneResponse updateMilestone(@PathVariable Long id,
                                             @PathVariable Long mid,
                                             @Valid @RequestBody MilestoneRequest req) {
        return milestoneService.update(mid, req, currentEmail());
    }

    @DeleteMapping("/{id}/milestones/{mid}")
    @PreAuthorize("hasRole('INNOVATOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMilestone(@PathVariable Long id,
                                @PathVariable Long mid) {
        milestoneService.delete(mid, currentEmail());
    }

    /**
     * Reads the authenticated principal's email straight from the SecurityContext.
     * JWT filter sets the principal to the email string (see JwtAuthFilter).
     */
    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("No authenticated principal in SecurityContext");
        }
        return auth.getName();
    }
}