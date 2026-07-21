package com.example.Innovation_backend.application;

import com.example.Innovation_backend.application.dto.ApplicationResponse;
import com.example.Innovation_backend.application.dto.StageUpdateRequest;
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
 *   PATCH /api/applications/{id}/stage              → move an applicant to a new stage
 *
 * Both routes require the caller to be either the owner of the underlying
 * opportunity or an admin; the service layer enforces that.
 *
 * Path convention follows plan §4.3:
 *   - Applicants are listed under the opportunity (resource-scoped).
 *   - Stage moves are under the application itself.
 */
@RestController
@RequiredArgsConstructor
public class ApplicantController {

    private final ApplicationService applicationService;

    @GetMapping("/api/opportunities/{opportunityId}/applicants")
    @PreAuthorize("hasAnyRole('FUNDER','ADMIN')")
    public List<ApplicationResponse> listApplicants(@PathVariable Long opportunityId) {
        return applicationService.listApplicants(opportunityId, currentEmail());
    }

    @PatchMapping("/api/applications/{id}/stage")
    @PreAuthorize("hasAnyRole('FUNDER','ADMIN')")
    public ApplicationResponse updateStage(
            @PathVariable Long id,
            @Valid @RequestBody StageUpdateRequest body) {
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