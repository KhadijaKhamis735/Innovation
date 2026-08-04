package com.example.Innovation_backend.organization;

import com.example.Innovation_backend.common.EmailService;
import com.example.Innovation_backend.organization.dto.OrganizationResponse;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class OrganizationService {

    private final OrganizationRepository orgRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;

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
        OrganizationStatus previousStatus = o.getStatus();
        o.setStatus(newStatus);
        Organization saved = orgRepo.save(o);

        // Phase 7 — notify the funder when their org is approved so they can
        // proceed with posting opportunities. We only email on the explicit
        // PENDING → APPROVED edge; demotions (APPROVED → REJECTED) and
        // re-approvals are intentionally not handled here. EmailService swallows
        // failures so the admin action still succeeds.
        if (previousStatus == OrganizationStatus.PENDING
                && newStatus == OrganizationStatus.APPROVED) {
            sendApprovalEmail(saved);
        }
        return OrganizationResponse.fromEntity(saved);
    }

    /**
     * "Your organisation has been approved — you can now post opportunities."
     * Reuses the funder's email from the org record; falls back to the linked
     * User row if the org's email was never set.
     */
    private void sendApprovalEmail(Organization org) {
        String recipient = org.getEmail();
        if (recipient == null || recipient.isBlank()) {
            if (org.getFunder() != null) {
                recipient = org.getFunder().getEmail();
            }
        }
        if (recipient == null || recipient.isBlank()) {
            log.warn("Cannot send approval email for org {} — no email on record", org.getId());
            return;
        }
        String orgName = (org.getName() == null || org.getName().isBlank())
                ? "your organisation"
                : org.getName();
        String firstName = (org.getFunder() != null && org.getFunder().getFirstName() != null)
                ? org.getFunder().getFirstName().trim()
                : "";
        String greeting = firstName.isEmpty() ? "Hi," : "Hi " + firstName + ",";
        String body = greeting + "\n\n"
                + "Good news — your organisation \"" + orgName + "\" has been approved on Innovation Hub.\n\n"
                + "You can now:\n"
                + "  • Post funding opportunities for innovators to apply to.\n"
                + "  • Review and manage applications from your dashboard.\n"
                + "  • Update your organisation profile any time from Settings.\n\n"
                + "Sign in to get started: http://localhost:5173/login\n\n"
                + "Welcome aboard!\n\n"
                + "— The Innovation Hub team";
        emailService.send(
                recipient,
                "Your Innovation Hub funder account is approved",
                body
        );
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