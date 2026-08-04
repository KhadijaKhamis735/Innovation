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

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

        // Public reads don't carry applicantCount (no use for it in the
        // discoverability flow and the per-row extra query isn't worth it).
        return rows.stream().map(o -> toResponse(o, 0L)).toList();
    }

    @Transactional(readOnly = true)
    public OpportunityResponse getOnePublic(Long id) {
        Opportunity o = opportunityRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Opportunity not found: " + id));
        return toResponse(o, 0L);
    }

    // ── Funder owner-scoped reads ────────────────────────────────────

    /**
     * Phase 5 — returns every opportunity owned by the calling funder (open,
     * closed, and draft), newest first. Each row carries its real
     * {@code applicantCount} so the mobile {@code MyOpportunities} list and
     * the FunderDashboard can render honest totals without N+1 lookups.
     */
    @Transactional(readOnly = true)
    public List<OpportunityResponse> listMine(String email) {
        User funder = mustFunder(email);
        List<Opportunity> rows = opportunityRepo.findAllByFunderIdOrderByCreatedAtDesc(funder.getId());
        Map<Long, Long> counts = loadApplicantCounts(rows);
        return rows.stream()
                .map(o -> toResponse(o, counts.getOrDefault(o.getId(), 0L)))
                .toList();
    }

    /**
     * Phase 5 — dedicated close/reopen flow. The PUT path is reserved for
     * editing the mutable body fields; status changes go here so the public
     * "OPEN only" invariant stays under server control.
     *
     * <p>{@link OpportunityStatus#DRAFT} is intentionally not settable through
     * this endpoint — DRAFT is reserved for a future "save as draft" UI. A
     * request for {@code ?status=draft} throws {@link IllegalArgumentException}
     * which the global handler maps to 400.
     */
    @Transactional
    public OpportunityResponse updateStatus(Long id, OpportunityStatus newStatus, String email) {
        if (newStatus == OpportunityStatus.DRAFT) {
            // Surface a clear client-facing message; GlobalExceptionHandler maps
            // IllegalArgumentException → 400 Bad Request.
            throw new IllegalArgumentException("status must be 'open' or 'closed'");
        }
        User funder = mustFunder(email);
        Opportunity o = loadOwned(id, funder.getId());
        o.setStatus(newStatus);
        Opportunity saved = opportunityRepo.save(o);
        return toResponse(saved, applicantCount(saved.getId()));
    }

    private long applicantCount(Long opportunityId) {
        Map<Long, Long> counts = loadApplicantCounts(List.of(
                opportunityRepo.findById(opportunityId).orElse(null)
        ));
        return counts.getOrDefault(opportunityId, 0L);
    }

    /**
     * Single grouped query that returns {@code (opportunityId → count)} for
     * the given opportunities. Opportunities with zero applications are absent
     * from the result — callers fall back to 0L via {@code getOrDefault}.
     */
    private Map<Long, Long> loadApplicantCounts(List<Opportunity> opportunities) {
        if (opportunities == null || opportunities.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Long> ids = new ArrayList<>(opportunities.size());
        for (Opportunity o : opportunities) ids.add(o.getId());
        List<Object[]> rows = opportunityRepo.countApplicationsByOpportunityIds(ids);
        Map<Long, Long> out = new HashMap<>(rows.size() * 2);
        for (Object[] row : rows) {
            out.put((Long) row[0], (Long) row[1]);
        }
        return out;
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
                .requirements(req.requirements())
                .tags(normaliseTags(req.tags()))
                // Phase 8 — application form type. Null in the request means
                // the funder didn't pick one, which we treat as the default
                // (full innovation application) so post-Phase-7 callers
                // without UI support still create a valid opportunity.
                .applicationFormType(req.applicationFormType() != null
                        ? req.applicationFormType()
                        : com.example.Innovation_backend.opportunity.ApplicationFormType.INNOVATION_APPLICATION)
                // status defaults to OPEN in the entity builder
                .build();
        return toResponse(opportunityRepo.save(o), 0L);
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
        o.setRequirements(req.requirements());
        o.setTags(normaliseTags(req.tags()));
        // Phase 8 — same defaulting as create. A null in the request means
        // "keep what was there" via the existing setter fallback.
        if (req.applicationFormType() != null) {
            o.setApplicationFormType(req.applicationFormType());
        }
        // status intentionally NOT updated here — close/reopen is a dedicated flow.
        return toResponse(opportunityRepo.save(o), applicantCount(o.getId()));
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

    /**
     * Phase 5 — strip blanks/nulls and bound the length so we never persist
     * an empty string from a half-typed tag input. Returns an empty list when
     * the request leaves the field null (which keeps the column NOT NULL happy
     * with the JSONB default).
     */
    private static List<String> normaliseTags(List<String> raw) {
        if (raw == null || raw.isEmpty()) return new ArrayList<>();
        List<String> out = new ArrayList<>(raw.size());
        for (String t : raw) {
            if (t == null) continue;
            String trimmed = t.trim();
            if (!trimmed.isEmpty()) out.add(trimmed);
        }
        return out;
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
     *
     * Lookup strategy:
     *   1. By {@code funder_id} — the normal path. The org is auto-created
     *      on register with the funder's User id, and the unique constraint
     *      guarantees one row per funder.
     *   2. By email — fallback for when the User row was recreated (e.g. the
     *      user re-registered after being deleted, or a seed re-run wiped
     *      users but not orgs) and the org's stored funder_id no longer
     *      points at the current User. The org still has the funder's email,
     *      which is stable across that recreation. When we find an org this
     *      way we silently re-bind it to the current user so future lookups
     *      hit the fast path.
     */
    private void requireApprovedOrg(User funder) {
        Organization org = organizationRepo.findByFunderId(funder.getId()).orElse(null);

        if (org == null) {
            org = organizationRepo.findFirstByEmailIgnoreCase(funder.getEmail()).orElse(null);
            if (org != null) {
                // Self-heal: re-bind the orphan org to the current User so the
                // next lookup hits the fast path. Only do this when the
                // rebind target is actually free — the unique constraint on
                // funder_id guards against double-binding.
                if (!organizationRepo.existsByFunderId(funder.getId())) {
                    org.setFunder(funder);
                    organizationRepo.save(org);
                } else {
                    // Race: another funder already claimed this slot. Fall
                    // back to "not approved" rather than corrupt the link.
                    org = null;
                }
            }
        }

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
    OpportunityResponse toResponse(Opportunity o, long applicantCount) {
        String orgName = organizationRepo.findByFunderId(o.getFunder().getId())
                .map(Organization::getName)
                .orElse(null);
        return OpportunityResponse.fromEntity(o, orgName, applicantCount);
    }

    /**
     * Convenience overload for callers that don't care about
     * {@code applicantCount} (public reads, admin reads). Passes {@code 0}.
     */
    OpportunityResponse toResponse(Opportunity o) {
        return toResponse(o, 0L);
    }
}