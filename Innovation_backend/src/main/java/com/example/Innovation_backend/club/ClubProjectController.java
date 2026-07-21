package com.example.Innovation_backend.club;

import com.example.Innovation_backend.club.dto.ClubProjectRequest;
import com.example.Innovation_backend.club.dto.ClubProjectResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Club project endpoints (Phase 5A).
 *
 *   POST   /api/club/projects                    (club-member, ACTIVE)  create
 *   GET    /api/club/projects/me                 (club-member)          own projects
 *   DELETE /api/club/projects/{id}               (club-member, owner)   delete
 *   GET    /api/club/branches/{id}/projects      (auth, same-university) branch feed
 *
 * Phase 5A follow-up — the branch-feed GET is no longer public. The service
 * enforces same-university access; @PreAuthorize here blocks anonymous and
 * Innovation-surface JWTs. ACTIVE-status gating for create is enforced in
 * the service (a PENDING member holds a valid CLUB_MEMBER token).
 */
@RestController
@RequiredArgsConstructor
public class ClubProjectController {

    private final ClubProjectService projectService;

    @PostMapping("/api/club/projects")
    @PreAuthorize("hasRole('CLUB_MEMBER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ClubProjectResponse create(@Valid @RequestBody ClubProjectRequest body) {
        return projectService.create(body);
    }

    @GetMapping("/api/club/projects/me")
    @PreAuthorize("hasRole('CLUB_MEMBER')")
    public List<ClubProjectResponse> listMine() {
        return projectService.listMine();
    }

    @DeleteMapping("/api/club/projects/{id}")
    @PreAuthorize("hasRole('CLUB_MEMBER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        projectService.delete(id);
    }

    /** Branch feed — university-scoped. Surfaced in the branch detail page. */
    @GetMapping("/api/club/branches/{id}/projects")
    @PreAuthorize("hasAnyRole('CLUB_MEMBER','CLUB_LEADER','ADMIN')")
    public List<ClubProjectResponse> listForBranch(@PathVariable Long id) {
        return projectService.listForBranch(id);
    }
}
