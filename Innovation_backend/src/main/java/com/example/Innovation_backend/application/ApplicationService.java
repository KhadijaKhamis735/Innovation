package com.example.Innovation_backend.application;

import com.example.Innovation_backend.application.dto.ApplicationRequest;
import com.example.Innovation_backend.application.dto.ApplicationResponse;
import com.example.Innovation_backend.opportunity.Opportunity;
import com.example.Innovation_backend.opportunity.OpportunityRepository;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Business logic for innovator applications.
 *
 * Rules enforced here:
 *   1. Only INNOVATOR role may apply. ({@code mustInnovator})
 *   2. The opportunity must exist and be OPEN. ({@code mustBeOpenable})
 *   3. An innovator can apply once per opportunity. (DB unique constraint +
 *      pre-check for a clean 409 instead of a constraint-violation 500.)
 *   4. Stage PATCHes are limited to the opportunity owner or admin. The
 *      applicant (innovator) cannot move their own stage.
 */
@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepo;
    private final OpportunityRepository opportunityRepo;
    private final UserRepository userRepo;

    // ── Innovator side ────────────────────────────────────────────────

    @Transactional
    public ApplicationResponse apply(Long opportunityId, ApplicationRequest req, String email) {
        User innovator = mustInnovator(email);
        Opportunity opp = mustBeOpenable(opportunityId);

        // Pre-check: cleaner 409 if the innovator already applied to this opp.
        applicationRepo.findByOpportunityIdAndInnovatorId(opp.getId(), innovator.getId())
                .ifPresent(existing -> {
                    throw new DuplicateApplicationException(
                            "You have already applied to this opportunity");
                });

        Application a = Application.builder()
                .opportunity(opp)
                .innovator(innovator)
                .ideaTitle(req.ideaTitle().trim())
                .problemStatement(req.problemStatement().trim())
                .proposedSolution(req.proposedSolution().trim())
                .estimatedBudget(req.estimatedBudget())
                .stage(ApplicationStage.SUBMITTED)
                .build();
        Application saved = applicationRepo.save(a);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> listMine(String email) {
        User innovator = mustInnovator(email);
        return applicationRepo
                .findAllByInnovatorIdOrderByAppliedAtDesc(innovator.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Funder / admin side ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ApplicationResponse> listApplicants(Long opportunityId, String email) {
        User caller = userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        Opportunity opp = opportunityRepo.findById(opportunityId)
                .orElseThrow(() -> new IllegalArgumentException("Opportunity not found: " + opportunityId));

        // Owner or admin only. A non-owner funder gets 403, not 404 — we want
        // them to know the opportunity exists, just that they can't view it.
        boolean isOwner = opp.getFunder().getId().equals(caller.getId());
        if (!isOwner && caller.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the opportunity owner or an admin can view applicants");
        }

        return applicationRepo.findAllByOpportunityIdOrderByAppliedAtDesc(opp.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ApplicationResponse updateStage(Long applicationId, ApplicationStage newStage, String email) {
        User caller = userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        Application a = applicationRepo.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        // Stage moves: opportunity owner or admin only.
        boolean isOwner = a.getOpportunity().getFunder().getId().equals(caller.getId());
        if (!isOwner && caller.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the opportunity owner or an admin can move stages");
        }

        a.setStage(newStage);
        return toResponse(applicationRepo.save(a));
    }

    // ── Internals ────────────────────────────────────────────────────

    /** Loads the caller and asserts INNOVATOR role. */
    private User mustInnovator(String email) {
        User u = userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        if (u.getRole() != Role.INNOVATOR) {
            throw new AccessDeniedException("Only innovators can apply to opportunities");
        }
        return u;
    }

    /**
     * Loads the opportunity and asserts it exists and is OPEN. CLOSED / DRAFT
     * opportunities reject new applications.
     */
    private Opportunity mustBeOpenable(Long opportunityId) {
        Opportunity opp = opportunityRepo.findById(opportunityId)
                .orElseThrow(() -> new IllegalArgumentException("Opportunity not found: " + opportunityId));
        if (opp.getStatus() != com.example.Innovation_backend.opportunity.OpportunityStatus.OPEN) {
            throw new ApplicationClosedException("This opportunity is not currently accepting applications");
        }
        return opp;
    }

    /**
     * Builds the DTO. Resolves both the opportunity title and the innovator
     * display fields explicitly so we don't trigger LazyInitializationException
     * outside the @Transactional boundary.
     */
    private ApplicationResponse toResponse(Application a) {
        String oppTitle = a.getOpportunity().getTitle();
        User innovator = a.getInnovator();
        String name = innovator.getFirstName() + " " + innovator.getLastName();
        return ApplicationResponse.fromEntity(a, oppTitle, name.trim(), innovator.getEmail());
    }

    // ── Local exceptions ──────────────────────────────────────────────

    /** Thrown when an innovator tries to apply twice to the same opportunity. */
    public static class DuplicateApplicationException extends RuntimeException {
        public DuplicateApplicationException(String message) { super(message); }
    }

    /** Thrown when applying to a CLOSED or DRAFT opportunity. */
    public static class ApplicationClosedException extends RuntimeException {
        public ApplicationClosedException(String message) { super(message); }
    }
}