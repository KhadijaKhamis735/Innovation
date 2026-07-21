package com.example.Innovation_backend.application;

import com.example.Innovation_backend.application.dto.ApplicationRequest;
import com.example.Innovation_backend.application.dto.ApplicationResponse;
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
 * Innovator-facing application endpoints.
 *
 *   POST  /api/opportunities/{id}/apply    → submit a new application
 *   GET   /api/applications/me              → list the caller's own applications
 *
 * Funder-owner reads (applicants) and stage PATCH live in {@link ApplicantController}
 * to keep this class focused on the innovator side.
 *
 * The acting user's email is read from SecurityContextHolder rather than
 * @AuthenticationPrincipal, which was unreliable in earlier phases.
 */
@RestController
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    /**
     * Apply to a specific opportunity. Path is nested under /api/opportunities
     * because the resource being acted on IS the opportunity.
     */
    @PostMapping("/api/opportunities/{opportunityId}/apply")
    @PreAuthorize("hasRole('INNOVATOR')")
    public ResponseEntity<ApplicationResponse> apply(
            @PathVariable Long opportunityId,
            @Valid @RequestBody ApplicationRequest req) {
        ApplicationResponse created = applicationService.apply(opportunityId, req, currentEmail());
        return ResponseEntity
                .created(URI.create("/api/applications/" + created.id()))
                .body(created);
    }

    /** The caller's own applications, newest first. */
    @GetMapping("/api/applications/me")
    @PreAuthorize("hasRole('INNOVATOR')")
    public List<ApplicationResponse> listMine() {
        return applicationService.listMine(currentEmail());
    }

    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("No authenticated principal in SecurityContext");
        }
        return auth.getName();
    }
}