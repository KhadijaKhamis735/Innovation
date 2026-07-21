package com.example.Innovation_backend.opportunity;

import com.example.Innovation_backend.opportunity.dto.OpportunityResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only endpoints for moderating opportunities. Path: /api/admin/opportunities.
 *
 * - GET lists all opportunities regardless of status (the public endpoint only
 *   returns OPEN; admins need to see CLOSED and DRAFT too).
 * - DELETE reuses {@link OpportunityService#delete} which already permits
 *   admins to remove any opportunity (added in 3B final-stretch).
 *
 * Like the other admin controllers (AdminOrganizationController, AdminProjectController),
 * we read the caller's email via SecurityContextHolder rather than
 * @AuthenticationPrincipal, which was unreliable in earlier phases.
 */
@RestController
@RequestMapping("/api/admin/opportunities")
@RequiredArgsConstructor
public class AdminOpportunityController {

    private final OpportunityService opportunityService;
    private final OpportunityRepository opportunityRepo;

    /**
     * List all opportunities. Pass {@code ?status=open} to narrow by status.
     * No body / no audit metadata — this is a read-only moderation queue.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<OpportunityResponse> list(
            @RequestParam(name = "status", required = false) OpportunityStatus status) {
        // We reuse the public-facing toResponse formatter for consistency with
        // /api/opportunities — admins see the same shape (so the UI doesn't need
        // to handle two projections).
        List<Opportunity> rows = (status == null)
                ? opportunityRepo.findAllForAdmin()
                : opportunityRepo.findAllForAdminByStatus(status);
        return rows.stream()
                .map(opportunityService::toResponse)
                .toList();
    }

    /** Admin can DELETE any opportunity (funder-owner check is bypassed). */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        opportunityService.delete(id, currentEmail());
    }

    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("No authenticated principal in SecurityContext");
        }
        return auth.getName();
    }
}