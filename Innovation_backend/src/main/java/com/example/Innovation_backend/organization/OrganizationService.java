package com.example.Innovation_backend.organization;

import com.example.Innovation_backend.organization.dto.OrganizationResponse;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Admin-side operations on organizations. The auto-creation on funder
 * register lives in {@link com.example.Innovation_backend.auth.AuthService}.
 */
@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository orgRepo;
    private final UserRepository userRepo;

    @Transactional(readOnly = true)
    public List<OrganizationResponse> listByStatus(OrganizationStatus status, String adminEmail) {
        mustBeAdmin(adminEmail);
        return orgRepo.findAllByStatusOrderBySubmittedDateAsc(status)
                .stream()
                .map(OrganizationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public OrganizationResponse updateStatus(Long id, OrganizationStatus newStatus, String adminEmail) {
        mustBeAdmin(adminEmail);
        Organization o = orgRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found: " + id));
        if (o.getStatus() == newStatus) {
            // No-op; return current state
            return OrganizationResponse.fromEntity(o);
        }
        o.setStatus(newStatus);
        return OrganizationResponse.fromEntity(orgRepo.save(o));
    }

    /**
     * Called by AuthService when a new funder registers. Creates a PENDING
     * organization tied to that funder's user id. Idempotent — if the user
     * already has an org, returns the existing one.
     */
    @Transactional
    public Organization createPendingForFunder(User funder) {
        return orgRepo.findByFunderId(funder.getId()).orElseGet(() -> {
            Organization o = Organization.builder()
                    .funder(funder)
                    .name((funder.getFirstName() + " " + funder.getLastName()).trim())
                    .email(funder.getEmail())
                    .location(null)
                    .type(null)
                    .status(OrganizationStatus.PENDING)
                    .build();
            return orgRepo.save(o);
        });
    }

    private void mustBeAdmin(String email) {
        User u = userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        if (u.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Admin role required");
        }
    }
}