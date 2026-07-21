package com.example.Innovation_backend.opportunity;

import com.example.Innovation_backend.opportunity.dto.OpportunityRequest;
import com.example.Innovation_backend.opportunity.dto.OpportunityResponse;
import com.example.Innovation_backend.organization.Organization;
import com.example.Innovation_backend.organization.OrganizationRepository;
import com.example.Innovation_backend.organization.OrganizationStatus;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Business logic for opportunities. Three rules enforced here:
 *
 *   1. Only users with role=FUNDER may POST/PUT/DELETE.
 *   2. POST is gated on the funder having an Organization with status=APPROVED.
 *      A funder whose org is PENDING or REJECTED — or who has no org at all —
 *      gets a 403 with the message "Your organization is not approved yet".
 *   3. PUT and DELETE require the caller to be the opportunity's owner (admin
 *      bypass is NOT added in Phase 3B — admin moderation lives in the org layer).
 *
 * Public reads (list / getOne) bypass all three rules. The public list filters
 * to status=OPEN by default; an optional ?type= filter narrows further.
 */
@Service
@RequiredArgsConstructor
public class OpportunityService {

    private final OpportunityRepository opportunityRepo;
    private final OrganizationRepository organizationRepo;
    private final UserRepository userRepo;

    // ── Public reads ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OpportunityResponse> listPublic(OpportunityStatus statusFilter, OpportunityType typeFilter) {
        // Default behavior: status=null → OPEN only. Caller passes null to get the public feed.
        OpportunityStatus effective = (statusFilter == null) ? OpportunityStatus.OPEN : statusFilter;

        List<Opportunity> rows = (typeFilter == null)
                ? opportunityRepo.findAllByStatusOrderByCreatedAtDesc(effective)
                : opportunityRepo.findAllByStatusAndTypeOrderByCreatedAtDesc(effective, typeFilter);

        return rows.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OpportunityResponse getOnePublic(Long id) {
        Opportunity o = opportunityRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Opportunity not found: " + id));
        return toResponse(o);
    }

    // ── Funder mutations ─────────────────────────────────────────────

    @Transactional
    public OpportunityResponse create(OpportunityRequest req, String email) {
        User funder = mustFunder(email);
        requireApprovedOrg(funder);   // ← the gating check

        Opportunity o = Opportunity.builder()
                .funder(funder)
                .title(req.title().trim())
                .description(req.description())
                .type(req.type())
                .amount(req.amount())
                .deadline(req.deadline())
                .location(req.location())
                // status defaults to OPEN in the entity builder
                .build();
        return toResponse(opportunityRepo.save(o));
    }

    @Transactional
    public OpportunityResponse update(Long id, OpportunityRequest req, String email) {
        User funder = mustFunder(email);
        requireApprovedOrg(funder);   // keep the gate consistent on edits too

        Opportunity o = loadOwned(id, funder.getId());
        o.setTitle(req.title().trim());
        o.setDescription(req.description());
        o.setType(req.type());
        o.setAmount(req.amount());
        o.setDeadline(req.deadline());
        o.setLocation(req.location());
        // status intentionally NOT updated here — close/reopen is a dedicated flow.
        return toResponse(opportunityRepo.save(o));
    }

    @Transactional
    public void delete(Long id, String email) {
        User caller = mustFunderOrAdmin(email);
        Opportunity o;
        if (caller.getRole() == Role.ADMIN) {
            // Admin moderation path: can delete any opportunity. 404 if it doesn't exist.
            o = opportunityRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Opportunity not found: " + id));
        } else {
            // Funder path: owner-check only, no org gate (if you're the owner, you can remove it).
            o = loadOwned(id, caller.getId());
        }
        opportunityRepo.delete(o);
    }

    // ── Internals ────────────────────────────────────────────────────

    /** Loads an opportunity that belongs to the caller; 404 if missing or not owned. */
    private Opportunity loadOwned(Long id, Long funderId) {
        return opportunityRepo.findById(id)
                .filter(o -> o.getFunder().getId().equals(funderId))
                .orElseThrow(() -> new IllegalArgumentException("Opportunity not found: " + id));
    }

    /** Loads the caller and asserts FUNDER role. */
    private User mustFunder(String email) {
        User u = userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        if (u.getRole() != Role.FUNDER) {
            throw new AccessDeniedException("Only funders can manage opportunities");
        }
        return u;
    }

    /**
     * Loads the caller and asserts FUNDER or ADMIN role. Used by DELETE,
     * where admins can moderate any opportunity but funders can only delete
     * their own.
     */
    private User mustFunderOrAdmin(String email) {
        User u = userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        if (u.getRole() != Role.FUNDER && u.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only funders and admins can delete opportunities");
        }
        return u;
    }

    /**
     * The gating check. Throws 403 with a specific message that the frontend
     * can surface verbatim: "Your organization is not approved yet".
     */
    private void requireApprovedOrg(User funder) {
        Organization org = organizationRepo.findByFunderId(funder.getId()).orElse(null);
        if (org == null || org.getStatus() != OrganizationStatus.APPROVED) {
            throw new AccessDeniedException("Your organization is not approved yet");
        }
    }

    /**
     * Builds the DTO, resolving the funder's organization name without triggering
     * a LazyInitializationException (we look it up explicitly).
     *
     * Package-private so {@link AdminOpportunityController} can reuse the same
     * projection without forcing the admin view to format its own DTO.
     */
    OpportunityResponse toResponse(Opportunity o) {
        String orgName = organizationRepo.findByFunderId(o.getFunder().getId())
                .map(Organization::getName)
                .orElse(null);
        return OpportunityResponse.fromEntity(o, orgName);
    }
}