package com.example.Innovation_backend.organization;

import com.example.Innovation_backend.organization.dto.OrganizationResponse;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Phase 7 — funder self-service endpoints. Powered by the same
 * {@link OrganizationService} + {@link OrganizationRepository} the admin side
 * uses, but locked down to the calling funder.
 *
 * The frontend hits {@code GET /api/organizations/me} on every protected
 * funder page (PostOpportunity, MyOpportunities, FunderDashboard) so it can
 * render a friendly "awaiting admin approval" banner when the org is
 * PENDING or REJECTED instead of the generic 403 the user used to see.
 *
 * Funder-only by contract: callers with any other role get 403.
 */
@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class FunderOrganizationController {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final OrganizationService organizationService;

    /**
     * Returns the calling funder's own organization. 404 if no org has been
     * created yet (e.g. the user registered as a non-funder and later changed
     * roles — shouldn't happen with the current register flow, but be safe).
     */
    @GetMapping("/me")
    public OrganizationResponse myOrganization() {
        User funder = requireFunder();
        Organization org = organizationRepository.findByFunderId(funder.getId())
                .orElseGet(() -> organizationRepository
                        .findFirstByEmailIgnoreCase(funder.getEmail())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "No organization on record for the current funder")));
        return OrganizationResponse.fromEntity(org);
    }

    /**
     * Funder self-service profile update. Only the mutable display fields
     * (name, location, type) are accepted — status changes are admin-only.
     */
    @PutMapping("/me")
    public OrganizationResponse updateMine(@RequestBody Map<String, Object> body) {
        User funder = requireFunder();
        Organization org = organizationRepository.findByFunderId(funder.getId())
                .orElseGet(() -> organizationRepository
                        .findFirstByEmailIgnoreCase(funder.getEmail())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "No organization on record for the current funder")));
        if (body.containsKey("name") && body.get("name") instanceof String s) {
            String trimmed = s.trim();
            if (!trimmed.isEmpty()) org.setName(trimmed);
        }
        if (body.containsKey("location") && body.get("location") instanceof String s) {
            org.setLocation(s.trim().isEmpty() ? null : s.trim());
        }
        if (body.containsKey("type") && body.get("type") instanceof String s) {
            org.setType(s.trim().isEmpty() ? null : s.trim());
        }
        return OrganizationResponse.fromEntity(organizationRepository.save(org));
    }

    private User requireFunder() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Not authenticated");
        }
        User u = userRepository.findByEmail(auth.getName().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException(
                        "User not found: " + auth.getName()));
        if (u.getRole() != Role.FUNDER) {
            throw new AccessDeniedException("Funder role required");
        }
        return u;
    }
}
