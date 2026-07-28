package com.example.Innovation_backend.project;

import com.example.Innovation_backend.auth.WriteGuard;
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
 * Unified project endpoints (Phase 5C-A).
 *
 * Replaces the old {@code ProjectController} (innovation) and
 * {@code ClubProjectController} (club). The acting surface is derived from
 * the JWT role — see {@link ProjectService#create}.
 *
 * Per-endpoint @PreAuthorize matrix:
 *   GET  /api/projects/me                        INNOVATOR | CLUB_MEMBER | CLUB_LEADER | ADMIN
 *   POST /api/projects                           INNOVATOR | CLUB_MEMBER | CLUB_LEADER
 *   GET  /api/projects/{id}                      isAuthenticated (privacy in service)
 *   PUT  /api/projects/{id}                      INNOVATOR | CLUB_MEMBER | CLUB_LEADER
 *   DELETE /api/projects/{id}                    INNOVATOR | CLUB_MEMBER | CLUB_LEADER
 *   PATCH /api/projects/{id}/phase               INNOVATOR | CLUB_MEMBER | CLUB_LEADER
 *   POST /api/projects/{id}/milestones           INNOVATOR | CLUB_MEMBER | CLUB_LEADER
 *   PATCH /api/projects/{id}/milestones/{mid}    INNOVATOR | CLUB_MEMBER | CLUB_LEADER
 *   DELETE /api/projects/{id}/milestones/{mid}   INNOVATOR | CLUB_MEMBER | CLUB_LEADER
 *   GET  /api/club/branches/{id}/projects        CLUB_MEMBER | CLUB_LEADER | ADMIN
 *
 * Phase 6B — every write method calls {@link WriteGuard#requireVerified()}.
 */
@RestController
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final MilestoneService milestoneService;
    private final WriteGuard writeGuard;

    // ── Project CRUD ────────────────────────────────────────────────

    @GetMapping("/api/projects/me")
    @PreAuthorize("hasAnyRole('INNOVATOR','CLUB_MEMBER','CLUB_LEADER','ADMIN')")
    public List<ProjectResponse> listMine() {
        return projectService.listMine(currentEmail());
    }

    @PostMapping("/api/projects")
    @PreAuthorize("hasAnyRole('INNOVATOR','CLUB_MEMBER','CLUB_LEADER')")
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectRequest req) {
        writeGuard.requireVerified();
        ProjectResponse created = projectService.create(req, currentEmail());
        return ResponseEntity.created(URI.create("/api/projects/" + created.id())).body(created);
    }

    @GetMapping("/api/projects/{id}")
    @PreAuthorize("isAuthenticated()")
    public ProjectResponse getOne(@PathVariable Long id) {
        return projectService.getOne(id, currentEmail());
    }

    @PutMapping("/api/projects/{id}")
    @PreAuthorize("hasAnyRole('INNOVATOR','CLUB_MEMBER','CLUB_LEADER')")
    public ProjectResponse update(@PathVariable Long id,
                                  @Valid @RequestBody ProjectRequest req) {
        writeGuard.requireVerified();
        return projectService.update(id, req, currentEmail());
    }

    @DeleteMapping("/api/projects/{id}")
    @PreAuthorize("hasAnyRole('INNOVATOR','CLUB_MEMBER','CLUB_LEADER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        writeGuard.requireVerified();
        projectService.delete(id, currentEmail());
    }

    @PatchMapping("/api/projects/{id}/phase")
    @PreAuthorize("hasAnyRole('INNOVATOR','CLUB_MEMBER','CLUB_LEADER')")
    public ProjectResponse updatePhase(@PathVariable Long id,
                                       @RequestParam ProjectPhase phase) {
        writeGuard.requireVerified();
        return projectService.updatePhase(id, phase, currentEmail());
    }

    // ── Milestones (innovation-surface only — club projects have no milestones) ──

    @PostMapping("/api/projects/{id}/milestones")
    @PreAuthorize("hasAnyRole('INNOVATOR','CLUB_MEMBER','CLUB_LEADER')")
    public ProjectResponse addMilestone(@PathVariable Long id,
                                        @Valid @RequestBody MilestoneRequest req) {
        writeGuard.requireVerified();
        return milestoneService.add(id, req, currentEmail());
    }

    @PatchMapping("/api/projects/{id}/milestones/{mid}")
    @PreAuthorize("hasAnyRole('INNOVATOR','CLUB_MEMBER','CLUB_LEADER')")
    public MilestoneResponse updateMilestone(@PathVariable Long id,
                                             @PathVariable Long mid,
                                             @Valid @RequestBody MilestoneRequest req) {
        writeGuard.requireVerified();
        return milestoneService.update(mid, req, currentEmail());
    }

    @DeleteMapping("/api/projects/{id}/milestones/{mid}")
    @PreAuthorize("hasAnyRole('INNOVATOR','CLUB_MEMBER','CLUB_LEADER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMilestone(@PathVariable Long id,
                                @PathVariable Long mid) {
        writeGuard.requireVerified();
        milestoneService.delete(mid, currentEmail());
    }

    // ── Branch feed (Phase 5A — kept on the unified controller) ─────

    @GetMapping("/api/club/branches/{id}/projects")
    @PreAuthorize("hasAnyRole('CLUB_MEMBER','CLUB_LEADER','ADMIN')")
    public List<ProjectResponse> listForBranch(@PathVariable Long id) {
        return projectService.listForBranch(id);
    }

    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("No authenticated principal in SecurityContext");
        }
        return auth.getName();
    }
}
