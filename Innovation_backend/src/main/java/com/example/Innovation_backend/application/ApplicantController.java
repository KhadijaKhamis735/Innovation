package com.example.Innovation_backend.application;

import com.example.Innovation_backend.application.dto.ApplicationResponse;
import com.example.Innovation_backend.application.dto.StageUpdateRequest;
import com.example.Innovation_backend.auth.WriteGuard;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Funder-owner (or admin) endpoints for viewing applicants and moving their stages.
 *
 *   GET   /api/opportunities/{id}/applicants      → list all applicants for an opportunity
 *   GET   /api/applications/received                → funder-wide applicant aggregate (Phase 6)
 *   PATCH /api/applications/{id}/stage              → move an applicant to a new stage
 *
 * All routes require the caller to be either the owner of the underlying
 * opportunity or an admin; the service layer enforces that.
 *
 * Path convention follows plan §4.3:
 *   - The per-opportunity applicants read stays under the opportunity (resource-scoped).
 *   - The funder-wide aggregate is under /api/applications/* (matches the
 *     innovator's "GET /api/applications/me" surface).
 *   - Stage moves are under the application itself.
 *
 * Phase 6B — stage PATCH is gated by {@link WriteGuard}; admin bypasses.
 */
@RestController
@RequiredArgsConstructor
public class ApplicantController {

    private final ApplicationService applicationService;
    private final WriteGuard writeGuard;

    @GetMapping("/api/opportunities/{opportunityId}/applicants")
    @PreAuthorize("hasAnyRole('FUNDER','ADMIN')")
    public List<ApplicationResponse> listApplicants(@PathVariable Long opportunityId) {
        return applicationService.listApplicants(opportunityId, currentEmail());
    }

    /**
     * Phase 6 — funder-wide aggregate. Returns every application across every
     * opportunity owned by the authenticated funder (admin sees all), newest
     * first. Replaces the per-opportunity fan-out the web client used to do
     * and is the single source of truth for both clients' "Received
     * Applications" view.
     */
    @GetMapping("/api/applications/received")
    @PreAuthorize("hasAnyRole('FUNDER','ADMIN')")
    public List<ApplicationResponse> listReceived() {
        return applicationService.listReceived(currentEmail());
    }

    @PatchMapping("/api/applications/{id}/stage")
    @PreAuthorize("hasAnyRole('FUNDER','ADMIN')")
    public ApplicationResponse updateStage(
            @PathVariable Long id,
            @Valid @RequestBody StageUpdateRequest body) {
        writeGuard.requireVerified();
        return applicationService.updateStage(id, body.stage(), currentEmail());
    }

    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("No authenticated principal in SecurityContext");
        }
        return auth.getName();
    }
}