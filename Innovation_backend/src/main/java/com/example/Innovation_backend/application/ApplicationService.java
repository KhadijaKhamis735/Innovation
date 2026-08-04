package com.example.Innovation_backend.application;

import com.example.Innovation_backend.application.dto.ApplicationRequest;
import com.example.Innovation_backend.application.dto.ApplicationResponse;
import com.example.Innovation_backend.opportunity.ApplicationFormType;
import com.example.Innovation_backend.opportunity.Opportunity;
import com.example.Innovation_backend.opportunity.OpportunityRepository;
import com.example.Innovation_backend.project.ProjectApprovalStatus;
import com.example.Innovation_backend.project.ProjectEntity;
import com.example.Innovation_backend.project.ProjectRepository;
import com.example.Innovation_backend.project.ProjectSurface;
import com.example.Innovation_backend.project.attachment.AttachmentKind;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentRepository;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentResponse;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

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
 *   5. Phase 8 — the apply payload shape is determined by the opportunity's
 *      {@link ApplicationFormType}. INNOVATION_APPLICATION requires the four
 *      legacy fields (ideaTitle, problemStatement, proposedSolution,
 *      estimatedBudget); PROFILE_APPLICATION requires the profile fields
 *      (fullName, email, university, yearOfStudy, applicantLocation,
 *      motivation, hopesToGain). Invalid combos are rejected with 400.
 *   6. Phase 9 — an optional {@code projectId} links the application to one of
 *      the innovator's own APPROVED (ZSA-ID-bearing) projects. On an
 *      INNOVATION_APPLICATION the link replaces the free-text pitch; on a
 *      PROFILE_APPLICATION it rides alongside the profile fields. Multiple
 *      funders may support the same project — nothing here blocks a second
 *      application for an already-funded project; prior awards are reported to
 *      the funder for transparency only.
 */
@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepo;
    private final OpportunityRepository opportunityRepo;
    private final UserRepository userRepo;
    private final ProjectRepository projectRepo;
    private final ProjectAttachmentRepository attachmentRepo;

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

        // Phase 8 — branch on the funder's chosen form type. Required fields
        // are validated here rather than via Bean Validation annotations so
        // the same record can serve both forms without conflicting
        // @NotBlank constraints.
        ApplicationFormType formType = opp.getApplicationFormType() == null
                ? ApplicationFormType.INNOVATION_APPLICATION
                : opp.getApplicationFormType();

        Application.ApplicationBuilder builder = Application.builder()
                .opportunity(opp)
                .innovator(innovator)
                .stage(ApplicationStage.SUBMITTED);

        // Phase 9 — "apply with an existing project". The link is orthogonal
        // to the form type: on an INNOVATION_APPLICATION it REPLACES the
        // free-text pitch (narrative read from the project); on a
        // PROFILE_APPLICATION it is an optional extra alongside the profile
        // fields. Either way the project must belong to the caller and be
        // admin-approved.
        ProjectEntity linked = null;
        if (req.projectId() != null) {
            linked = mustOwnApprovedProject(req.projectId(), innovator);
            builder.project(linked).pitchNote(blankToNull(req.pitchNote()));
        }

        switch (formType) {
            case INNOVATION_APPLICATION -> {
                if (linked != null) {
                    // Snapshot the project's narrative into the legacy NOT NULL
                    // columns. The funder's detail view reads the LIVE project
                    // via linkedProject, but the snapshot keeps this row
                    // readable if the project is later deleted (the FK is
                    // ON DELETE SET NULL, so the link — not the row — goes).
                    builder
                            .ideaTitle(truncate(linked.getName(), 200))
                            .problemStatement(firstNonBlank(
                                    linked.getDescription(),
                                    linked.getTagline(),
                                    "(see linked project " + linked.getZsaId() + ")"))
                            .proposedSolution(firstNonBlank(
                                    linked.getTagline(),
                                    linked.getDescription(),
                                    "(see linked project " + linked.getZsaId() + ")"))
                            .estimatedBudget(req.estimatedBudget())
                            .currentStage(linked.getPhase() == null ? null : linked.getPhase().json())
                            // Still honoured on the linked path: the project's
                            // evidence covers most of this, but a caller may
                            // attach an extra deck or demo URL for this
                            // specific opportunity. Dropping it silently would
                            // lose data the client believed it sent.
                            .supportingDocuments(blankToNull(req.supportingDocuments()));
                    break;
                }
                if (isBlank(req.ideaTitle())
                        || isBlank(req.problemStatement())
                        || isBlank(req.proposedSolution())) {
                    throw new InvalidApplicationPayloadException(
                            "This opportunity requires Idea / Project Title, Problem Statement, and Proposed Solution");
                }
                builder
                        .ideaTitle(req.ideaTitle().trim())
                        .problemStatement(req.problemStatement().trim())
                        .proposedSolution(req.proposedSolution().trim())
                        .estimatedBudget(req.estimatedBudget())
                        .currentStage(blankToNull(req.currentStage()))
                        .supportingDocuments(blankToNull(req.supportingDocuments()));
            }
            case PROFILE_APPLICATION -> {
                if (isBlank(req.fullName())
                        || isBlank(req.email())
                        || isBlank(req.university())
                        || isBlank(req.yearOfStudy())
                        || isBlank(req.applicantLocation())
                        || isBlank(req.motivation())
                        || isBlank(req.hopesToGain())) {
                    throw new InvalidApplicationPayloadException(
                            "This opportunity requires Full Name, Email, University, Year of Study, Location, Motivation, and Hopes to Gain");
                }
                builder
                        // Legacy four innovation fields stay NOT NULL on the
                        // table, so we fill them with safe placeholders so the
                        // NOT NULL constraint is satisfied. The funder's
                        // Received Applications view hides these for the
                        // PROFILE_APPLICATION rows.
                        .ideaTitle("Profile application")
                        .problemStatement("(profile application — see motivation)")
                        .proposedSolution("(profile application — see hopes to gain)")
                        .estimatedBudget(null)
                        .fullName(req.fullName().trim())
                        .email(req.email().trim())
                        .university(req.university().trim())
                        .yearOfStudy(req.yearOfStudy().trim())
                        .applicantLocation(req.applicantLocation().trim())
                        .motivation(req.motivation().trim())
                        .hopesToGain(req.hopesToGain().trim())
                        .cvLink(blankToNull(req.cvLink()));
            }
        }

        Application a = builder.build();
        Application saved = applicationRepo.save(a);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> listMine(String email) {
        User innovator = mustInnovator(email);
        return toResponses(applicationRepo
                .findAllByInnovatorIdOrderByAppliedAtDesc(innovator.getId()));
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

        return toResponses(
                applicationRepo.findAllByOpportunityIdOrderByAppliedAtDesc(opp.getId()));
    }

    /**
     * Phase 6 — every application across every opportunity owned by the
     * authenticated funder (or admin), flattened and sorted newest first.
     *
     * <p>This is the funder-scoped replacement for the web client's
     * "fetch all opportunities then per-id applicants" fan-out. Returning
     * one aggregate lets both web and mobile render a single list with
     * per-row stage labels and totals without N+1 round-trips.
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> listReceived(String email) {
        User caller = userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        if (caller.getRole() != Role.FUNDER && caller.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only funders and admins can view received applications");
        }

        // Admins see everything; funders only see applications on opportunities
        // they own. We project straight from the entity because the
        // applicantCount grouping already gave us per-opportunity numbers in
        // Phase 5; here we want the rows themselves.
        List<Application> rows = (caller.getRole() == Role.ADMIN)
                ? applicationRepo.findAllByOrderByAppliedAtDesc()
                : applicationRepo.findAllByOpportunityFunderIdOrderByAppliedAtDesc(caller.getId());

        return toResponses(rows);
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

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String blankToNull(String s) {
        return (s == null || s.trim().isEmpty()) ? null : s.trim();
    }

    /** First non-blank of the candidates, trimmed. Never returns null. */
    private static String firstNonBlank(String... candidates) {
        for (String c : candidates) {
            if (!isBlank(c)) return c.trim();
        }
        return "";
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        String t = s.trim();
        return t.length() <= max ? t : t.substring(0, max);
    }

    /**
     * Phase 9 — resolve the project an innovator wants to apply with, and
     * assert they are allowed to.
     *
     * <p>Three separate gates, each with a distinct failure message so the
     * innovator can act on it:
     * <ol>
     *   <li><b>Exists + owned</b> — a project belonging to someone else is
     *       reported as not-found, never as forbidden. Telling a caller
     *       "that project exists but isn't yours" leaks the id space.</li>
     *   <li><b>INNOVATION surface</b> — club projects have no ZSA ID and
     *       aren't part of the funding pipeline.</li>
     *   <li><b>APPROVED + has a ZSA ID</b> — the whole point of the feature
     *       is that the funder sees a verified, admin-approved project.
     *       A PENDING project would show a blank ZSA ID on the funder's
     *       card.</li>
     * </ol>
     *
     * <p>Deliberately absent: any check for prior funding. A project may
     * receive support from multiple funders — that is a product rule, and
     * the funder sees prior awards as transparency, not as a block.
     */
    private ProjectEntity mustOwnApprovedProject(Long projectId, User innovator) {
        ProjectEntity p = projectRepo.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        boolean owned = p.getOwnerUser() != null
                && p.getOwnerUser().getId().equals(innovator.getId());
        if (!owned) {
            // 404 not 403 — same privacy convention as ProjectService.loadOwned.
            throw new EntityNotFoundException("Project not found: " + projectId);
        }
        if (p.getSurface() != ProjectSurface.INNOVATION) {
            throw new InvalidApplicationPayloadException(
                    "Only innovation projects can be attached to an application");
        }
        if (p.getApprovalStatus() != ProjectApprovalStatus.APPROVED || isBlank(p.getZsaId())) {
            throw new InvalidApplicationPayloadException(
                    "Only approved projects with a ZSA ID can be used to apply. "
                            + "This project is still awaiting admin approval.");
        }
        return p;
    }

    /**
     * Builds the DTO. Resolves both the opportunity title and the innovator
     * display fields explicitly so we don't trigger LazyInitializationException
     * outside the @Transactional boundary.
     *
     * <p>Single-row variant — used on the write path where there is exactly
     * one application. List paths go through {@link #toResponses(List)} so the
     * funding-transparency lookup is batched rather than per-row.
     */
    private ApplicationResponse toResponse(Application a) {
        return toResponses(List.of(a)).get(0);
    }

    /**
     * Batch DTO mapper.
     *
     * <p>The expensive part of a linked application is the funding-transparency
     * block: "has this project already been accepted by other funders?". Done
     * naively that is one query per row. Here we collect every linked project
     * id first, issue ONE grouped query, and hand each row its slice — so a
     * funder with 200 received applications still pays a single extra query.
     * Evidence is likewise fetched per distinct project, not per application.
     */
    private List<ApplicationResponse> toResponses(List<Application> rows) {
        Set<Long> projectIds = rows.stream()
                .map(Application::getProject)
                .filter(Objects::nonNull)
                .map(ProjectEntity::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        // acceptedByProject: projectId -> [(applicationId, funderName), ...]
        Map<Long, List<Object[]>> acceptedByProject = projectIds.isEmpty()
                ? Map.of()
                : applicationRepo.findAcceptedFundingForProjects(projectIds).stream()
                        .collect(Collectors.groupingBy(r -> (Long) r[0]));

        return rows.stream().map(a -> {
            String oppTitle = a.getOpportunity().getTitle();
            User innovator = a.getInnovator();
            String name = (innovator.getFirstName() + " " + innovator.getLastName()).trim();

            ProjectEntity p = a.getProject();
            if (p == null) {
                return ApplicationResponse.fromEntity(a, oppTitle, name, innovator.getEmail());
            }

            List<ProjectAttachmentResponse> evidence = attachmentRepo
                    .findAllByProjectIdOrderByUploadedAtDesc(p.getId()).stream()
                    .filter(att -> att.getKind() == AttachmentKind.EVIDENCE)
                    .map(ProjectAttachmentResponse::fromEntity)
                    .toList();

            // "Other" funding = ACCEPTED applications for this project that are
            // neither THIS application nor an award made by the funder who owns
            // the opportunity being viewed. Without the second exclusion a
            // funder running two opportunities would be told its own award on
            // one of them is third-party support on the other.
            Long viewingFunderId = a.getOpportunity().getFunder().getId();
            List<Object[]> accepted = acceptedByProject.getOrDefault(p.getId(), List.of());
            List<Object[]> others = accepted.stream()
                    .filter(r -> !a.getId().equals(r[1]))
                    .filter(r -> !viewingFunderId.equals(r[2]))
                    .toList();

            // Count DISTINCT FUNDERS, not distinct names: two funders with no
            // organization row can share a display name, and collapsing them
            // would under-report prior funding. The name list is de-duplicated
            // separately, purely for display.
            int otherFundingCount = (int) others.stream()
                    .map(r -> (Long) r[2])
                    .distinct()
                    .count();
            List<String> otherFunders = others.stream()
                    .map(r -> (String) r[3])
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();

            var linked = new ApplicationResponse.LinkedProject(
                    p.getId(),
                    p.getZsaId(),
                    p.getName(),
                    p.getTagline(),
                    p.getDescription(),
                    p.getCategory(),
                    p.getPhase(),
                    p.getApprovalStatus(),
                    evidence,
                    otherFundingCount,
                    otherFunders
            );
            return ApplicationResponse.fromEntity(a, oppTitle, name, innovator.getEmail(), linked);
        }).toList();
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

    /** Thrown when the apply payload doesn't match the opportunity's form type. */
    public static class InvalidApplicationPayloadException extends RuntimeException {
        public InvalidApplicationPayloadException(String message) { super(message); }
    }
}