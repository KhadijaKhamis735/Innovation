package com.example.Innovation_backend.opportunity;

import com.example.Innovation_backend.opportunity.dto.OpportunityRequest;
import com.example.Innovation_backend.opportunity.dto.OpportunityResponse;
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
 * Phase 3B endpoints for opportunities. Path: /api/opportunities.
 *
 * Public reads are {@code permitAll()} in SecurityConfig; mutations are gated
 * by {@code @PreAuthorize("hasRole('FUNDER')")}. The org-approval gate is
 * enforced inside {@link OpportunityService} (it has to look at the DB).
 *
 * Like the other Phase 3 controllers, the acting user's email is read from
 * SecurityContextHolder rather than @AuthenticationPrincipal, because the
 * latter was unreliable in 3A.
 */
@RestController
@RequestMapping("/api/opportunities")
@RequiredArgsConstructor
public class OpportunityController {

    private final OpportunityService opportunityService;

    // ── Public reads ─────────────────────────────────────────────────

    /**
     * Public list. Returns OPEN opportunities by default; pass {@code ?status=closed}
     * to see closed postings, or {@code ?type=grant} to filter.
     */
    @GetMapping
    public List<OpportunityResponse> listPublic(
            @RequestParam(name = "status", required = false) OpportunityStatus status,
            @RequestParam(name = "type",   required = false) OpportunityType type) {
        return opportunityService.listPublic(status, type);
    }

    @GetMapping("/{id}")
    public OpportunityResponse getOne(@PathVariable Long id) {
        return opportunityService.getOnePublic(id);
    }

    // ── Funder mutations ─────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('FUNDER')")
    public ResponseEntity<OpportunityResponse> create(@Valid @RequestBody OpportunityRequest req) {
        OpportunityResponse created = opportunityService.create(req, currentEmail());
        return ResponseEntity
                .created(URI.create("/api/opportunities/" + created.id()))
                .body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FUNDER')")
    public OpportunityResponse update(@PathVariable Long id,
                                      @Valid @RequestBody OpportunityRequest req) {
        return opportunityService.update(id, req, currentEmail());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FUNDER','ADMIN')")
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