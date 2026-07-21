package com.example.Innovation_backend.organization;

import com.example.Innovation_backend.organization.dto.OrganizationResponse;
import com.example.Innovation_backend.organization.dto.OrganizationStatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin endpoints for moderating funder organizations. Path: /api/admin/organizations.
 * Per-method @PreAuthorize + SecurityContextHolder (avoids the NPE we saw in 3A).
 */
@RestController
@RequestMapping("/api/admin/organizations")
@RequiredArgsConstructor
public class AdminOrganizationController {

    private final OrganizationService organizationService;
    private final OrganizationRepository organizationRepository;

    /** List organizations by status. Defaults to PENDING so the admin queue is one click. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrganizationResponse> listByStatus(
            @RequestParam(name = "status", defaultValue = "PENDING") OrganizationStatus status) {
        return organizationService.listByStatus(status, currentEmail());
    }

    /** Approve / reject an organization. */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public OrganizationResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrganizationStatusRequest body) {
        return organizationService.updateStatus(id, body.status(), currentEmail());
    }

    /**
     * DIAGNOSTIC: returns ALL orgs regardless of status, with their raw status
     * string and email. Use to debug empty queue issues. Admin-only.
     *
     * GET /api/admin/organizations/diagnostic
     */
    @GetMapping("/diagnostic")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> diagnostic() {
        return organizationRepository.findAll().stream()
                .map(o -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", o.getId());
                    m.put("name", o.getName());
                    m.put("email", o.getEmail());
                    m.put("status", o.getStatus() != null ? o.getStatus().name() : null);
                    m.put("submittedDate", o.getSubmittedDate());
                    return m;
                })
                .toList();
    }

    /**
     * DIAGNOSTIC: count of orgs in each status bucket. Admin-only.
     *
     * GET /api/admin/organizations/diagnostic/counts
     */
    @GetMapping("/diagnostic/counts")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Long> diagnosticCounts() {
        Map<String, Long> counts = new java.util.LinkedHashMap<>();
        for (OrganizationStatus s : OrganizationStatus.values()) {
            counts.put(s.name(), (long) organizationRepository.findAllByStatusOrderBySubmittedDateAsc(s).size());
        }
        counts.put("TOTAL", organizationRepository.count());
        return counts;
    }

    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("No authenticated principal in SecurityContext");
        }
        return auth.getName();
    }
}