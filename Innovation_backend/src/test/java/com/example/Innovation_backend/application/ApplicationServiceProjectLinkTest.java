package com.example.Innovation_backend.application;

import com.example.Innovation_backend.application.dto.ApplicationRequest;
import com.example.Innovation_backend.application.dto.ApplicationResponse;
import com.example.Innovation_backend.opportunity.ApplicationFormType;
import com.example.Innovation_backend.opportunity.Opportunity;
import com.example.Innovation_backend.opportunity.OpportunityRepository;
import com.example.Innovation_backend.opportunity.OpportunityStatus;
import com.example.Innovation_backend.project.ProjectApprovalStatus;
import com.example.Innovation_backend.project.ProjectEntity;
import com.example.Innovation_backend.project.ProjectPhase;
import com.example.Innovation_backend.project.ProjectRepository;
import com.example.Innovation_backend.project.ProjectSurface;
import com.example.Innovation_backend.project.attachment.AttachmentKind;
import com.example.Innovation_backend.project.attachment.ProjectAttachment;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentRepository;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Phase 9 — service-level coverage for "apply with an existing project".
 *
 * The controller slice mocks {@code ApplicationService}, so every gate below
 * is only reachable here. Contract under test:
 *   - projectId null  → unchanged new-idea behaviour, linkedProject is null
 *   - projectId set   → project must be owned, INNOVATION, APPROVED + ZSA ID
 *   - a project already funded by another funder is NOT blocked, only reported
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ApplicationServiceProjectLinkTest {

    private static final String EMAIL = "innovator@example.com";
    private static final Long OPP_ID = 10L;
    private static final Long PROJECT_ID = 42L;

    @Mock private ApplicationRepository applicationRepo;
    @Mock private OpportunityRepository opportunityRepo;
    @Mock private UserRepository userRepo;
    @Mock private ProjectRepository projectRepo;
    @Mock private ProjectAttachmentRepository attachmentRepo;

    @InjectMocks private ApplicationService service;

    private User innovator;
    private Opportunity opportunity;
    private ProjectEntity project;

    @BeforeEach
    void setUp() {
        innovator = User.builder()
                .id(7L)
                .email(EMAIL)
                .firstName("Alex")
                .lastName("Johnson")
                .role(Role.INNOVATOR)
                .build();

        User funder = User.builder()
                .id(9L).email("funder@example.com")
                .firstName("Fatuma").lastName("Said")
                .role(Role.FUNDER).build();

        opportunity = Opportunity.builder()
                .id(OPP_ID)
                .title("Climate Tech Fund")
                .funder(funder)
                .status(OpportunityStatus.OPEN)
                .applicationFormType(ApplicationFormType.INNOVATION_APPLICATION)
                .build();

        project = ProjectEntity.builder()
                .id(PROJECT_ID)
                .surface(ProjectSurface.INNOVATION)
                .name("Solar Irrigation Pump")
                .tagline("Low-cost solar pump for smallholders")
                .description("Smallholder farmers lack affordable irrigation.")
                .category("AgriTech")
                .phase(ProjectPhase.PROTOTYPE)
                .zsaId("ZSA-INV-2026-001")
                .approvalStatus(ProjectApprovalStatus.APPROVED)
                .ownerUser(innovator)
                .build();

        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(innovator));
        when(opportunityRepo.findById(OPP_ID)).thenReturn(Optional.of(opportunity));
        when(applicationRepo.findByOpportunityIdAndInnovatorId(OPP_ID, 7L))
                .thenReturn(Optional.empty());
        when(projectRepo.findById(PROJECT_ID)).thenReturn(Optional.of(project));
        when(attachmentRepo.findAllByProjectIdOrderByUploadedAtDesc(anyLong()))
                .thenReturn(List.of());
        when(applicationRepo.findAcceptedFundingForProjects(any())).thenReturn(List.of());
        // Echo the entity back with an id, as a real save would.
        when(applicationRepo.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            a.setId(100L);
            a.setAppliedAt(Instant.parse("2026-08-04T10:00:00Z"));
            a.setUpdatedAt(Instant.parse("2026-08-04T10:00:00Z"));
            return a;
        });
    }

    // ── New-idea path is unchanged ───────────────────────────────────

    @Test
    void apply_withoutProjectId_leavesLinkNull() {
        ApplicationRequest req = ApplicationRequest.innovation(
                "My Idea", "The problem", "The solution",
                new BigDecimal("1000"), "Idea", null);

        ApplicationResponse res = service.apply(OPP_ID, req, EMAIL);

        assertNull(res.projectId());
        assertNull(res.linkedProject());
        assertEquals("My Idea", res.ideaTitle());
        // No project lookup at all on the new-idea path.
        verify(projectRepo, never()).findById(anyLong());
    }

    // ── Happy path ───────────────────────────────────────────────────

    @Test
    void apply_withApprovedOwnedProject_linksAndSnapshots() {
        ApplicationRequest req = ApplicationRequest.existingProject(
                PROJECT_ID, new BigDecimal("12000"), "We match your climate focus.");

        ApplicationResponse res = service.apply(OPP_ID, req, EMAIL);

        assertEquals(PROJECT_ID, res.projectId());
        assertNotNull(res.linkedProject());
        assertEquals("ZSA-INV-2026-001", res.linkedProject().zsaId());
        assertEquals(ProjectPhase.PROTOTYPE, res.linkedProject().phase());
        assertEquals("We match your climate focus.", res.pitchNote());
        assertEquals(new BigDecimal("12000"), res.estimatedBudget());
        // Snapshot columns are filled from the project so the row survives
        // the project being deleted (FK is ON DELETE SET NULL).
        assertEquals("Solar Irrigation Pump", res.ideaTitle());
        assertEquals("prototype", res.currentStage());
    }

    @Test
    void apply_withLinkedProject_exposesEvidenceLive() {
        ProjectAttachment evidence = ProjectAttachment.builder()
                .id(5L)
                .project(project)
                .originalFilename("demo.mp4")
                .storagePath("/p/42/demo.mp4")
                .sizeBytes(1024L)
                .kind(AttachmentKind.EVIDENCE)
                .uploadedByUser(innovator)
                .uploadedAt(Instant.parse("2026-08-01T10:00:00Z"))
                .build();
        ProjectAttachment other = ProjectAttachment.builder()
                .id(6L)
                .project(project)
                .originalFilename("notes.txt")
                .storagePath("/p/42/notes.txt")
                .sizeBytes(10L)
                .kind(AttachmentKind.OTHER)
                .uploadedByUser(innovator)
                .uploadedAt(Instant.parse("2026-08-02T10:00:00Z"))
                .build();
        when(attachmentRepo.findAllByProjectIdOrderByUploadedAtDesc(PROJECT_ID))
                .thenReturn(List.of(evidence, other));

        ApplicationResponse res = service.apply(OPP_ID,
                ApplicationRequest.existingProject(PROJECT_ID, null, "note"), EMAIL);

        // OTHER-kind attachments are filtered out — only evidence is shown.
        assertEquals(1, res.linkedProject().evidence().size());
        assertEquals("demo.mp4", res.linkedProject().evidence().get(0).originalFilename());
    }

    // ── Gates ────────────────────────────────────────────────────────

    @Test
    void apply_withSomeoneElsesProject_returns404NotForbidden() {
        User stranger = User.builder().id(99L).email("other@example.com")
                .role(Role.INNOVATOR).build();
        project.setOwnerUser(stranger);

        // 404, not 403 — telling the caller "exists but not yours" leaks ids.
        assertThrows(EntityNotFoundException.class, () ->
                service.apply(OPP_ID,
                        ApplicationRequest.existingProject(PROJECT_ID, null, "n"), EMAIL));
        verify(applicationRepo, never()).save(any());
    }

    @Test
    void apply_withPendingProject_isRejected() {
        project.setApprovalStatus(ProjectApprovalStatus.PENDING);
        project.setZsaId(null);

        var ex = assertThrows(ApplicationService.InvalidApplicationPayloadException.class, () ->
                service.apply(OPP_ID,
                        ApplicationRequest.existingProject(PROJECT_ID, null, "n"), EMAIL));
        assertTrue(ex.getMessage().contains("awaiting admin approval"));
        verify(applicationRepo, never()).save(any());
    }

    @Test
    void apply_withApprovedButNoZsaId_isRejected() {
        // Defensive: admin could have cleared the ZSA ID via the override
        // endpoint. Without one the funder's card would render blank.
        project.setZsaId(null);

        assertThrows(ApplicationService.InvalidApplicationPayloadException.class, () ->
                service.apply(OPP_ID,
                        ApplicationRequest.existingProject(PROJECT_ID, null, "n"), EMAIL));
    }

    @Test
    void apply_withClubProject_isRejected() {
        project.setSurface(ProjectSurface.CLUB);

        var ex = assertThrows(ApplicationService.InvalidApplicationPayloadException.class, () ->
                service.apply(OPP_ID,
                        ApplicationRequest.existingProject(PROJECT_ID, null, "n"), EMAIL));
        assertTrue(ex.getMessage().contains("innovation projects"));
    }

    @Test
    void apply_withMissingProject_returns404() {
        when(projectRepo.findById(PROJECT_ID)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () ->
                service.apply(OPP_ID,
                        ApplicationRequest.existingProject(PROJECT_ID, null, "n"), EMAIL));
    }

    // ── Multi-funder rule ────────────────────────────────────────────

    @Test
    void apply_projectAlreadyFundedElsewhere_isAllowedAndReported() {
        // Application 55, owned by funder 77 (NOT the viewing funder 9), was
        // accepted by Green Fund.
        when(applicationRepo.findAcceptedFundingForProjects(any()))
                .thenReturn(List.<Object[]>of(new Object[]{PROJECT_ID, 55L, 77L, "Green Fund"}));

        ApplicationResponse res = service.apply(OPP_ID,
                ApplicationRequest.existingProject(PROJECT_ID, null, "n"), EMAIL);

        // Explicitly NOT blocked — a project may take support from many funders.
        assertEquals(1, res.linkedProject().otherFundingCount());
        assertEquals(List.of("Green Fund"), res.linkedProject().otherFunders());
    }

    @Test
    void linkedProject_doesNotCountItselfAsOtherFunding() {
        // The saved application is id 100; an accepted row for id 100 is THIS
        // application, not prior support from somewhere else.
        when(applicationRepo.findAcceptedFundingForProjects(any()))
                .thenReturn(List.<Object[]>of(new Object[]{PROJECT_ID, 100L, 9L, "Climate Tech Fund"}));

        ApplicationResponse res = service.apply(OPP_ID,
                ApplicationRequest.existingProject(PROJECT_ID, null, "n"), EMAIL);

        assertEquals(0, res.linkedProject().otherFundingCount());
        assertTrue(res.linkedProject().otherFunders().isEmpty());
    }

    @Test
    void linkedProject_doesNotReportTheViewingFunderAsAnOtherFunder() {
        // Regression: a funder running TWO opportunities accepts the project on
        // opportunity A (application 55), then views its application on
        // opportunity B. Both are funder id 9. Filtering only on application id
        // would tell funder 9 that funder 9 is third-party support.
        when(applicationRepo.findAcceptedFundingForProjects(any()))
                .thenReturn(List.<Object[]>of(new Object[]{PROJECT_ID, 55L, 9L, "Climate Tech Fund"}));

        ApplicationResponse res = service.apply(OPP_ID,
                ApplicationRequest.existingProject(PROJECT_ID, null, "n"), EMAIL);

        assertEquals(0, res.linkedProject().otherFundingCount());
        assertTrue(res.linkedProject().otherFunders().isEmpty());
    }

    @Test
    void otherFundingCount_countsFundersNotNames() {
        // Regression: two DIFFERENT funders (77, 88) with no organization row
        // happen to share a personal name. Counting distinct names would
        // report 1 and under-state the project's prior support.
        when(applicationRepo.findAcceptedFundingForProjects(any()))
                .thenReturn(List.<Object[]>of(
                        new Object[]{PROJECT_ID, 55L, 77L, "John Smith"},
                        new Object[]{PROJECT_ID, 56L, 88L, "John Smith"}));

        ApplicationResponse res = service.apply(OPP_ID,
                ApplicationRequest.existingProject(PROJECT_ID, null, "n"), EMAIL);

        assertEquals(2, res.linkedProject().otherFundingCount());
        // The display list stays de-duplicated — showing the name twice would
        // just look like a rendering bug to the funder.
        assertEquals(List.of("John Smith"), res.linkedProject().otherFunders());
    }

    @Test
    void apply_linkedPath_keepsSupportingDocuments() {
        // Regression: the linked branch used to build the row without ever
        // calling .supportingDocuments(), so a caller posting the field got a
        // 201 with the value silently discarded.
        ApplicationRequest req = new ApplicationRequest(
                null, null, null, null,
                null, "https://example.com/deck.pdf",
                null, null, null, null, null, null, null, null,
                PROJECT_ID, "note");

        ApplicationResponse res = service.apply(OPP_ID, req, EMAIL);

        assertEquals("https://example.com/deck.pdf", res.supportingDocuments());
    }

    // ── Profile form + optional link ─────────────────────────────────

    @Test
    void apply_profileFormWithOptionalProjectLink_keepsBothSides() {
        opportunity.setApplicationFormType(ApplicationFormType.PROFILE_APPLICATION);

        ApplicationRequest req = new ApplicationRequest(
                null, null, null, null, null, null,
                "Alex Johnson", "alex@example.com", "Univ of Nairobi", "3rd year",
                "Nairobi", "I want to learn", "Mentorship", null,
                PROJECT_ID, "note");

        ApplicationResponse res = service.apply(OPP_ID, req, EMAIL);

        // Profile fields still required and stored...
        assertEquals("Alex Johnson", res.fullName());
        assertEquals("Univ of Nairobi", res.university());
        // ...and the optional project link rides alongside them.
        assertEquals(PROJECT_ID, res.projectId());
        assertEquals("ZSA-INV-2026-001", res.linkedProject().zsaId());
    }

    @Test
    void apply_profileFormWithLink_stillValidatesProfileFields() {
        opportunity.setApplicationFormType(ApplicationFormType.PROFILE_APPLICATION);

        // A project link must not let an applicant skip the profile fields.
        ApplicationRequest req = ApplicationRequest.existingProject(
                PROJECT_ID, null, "note");

        assertThrows(ApplicationService.InvalidApplicationPayloadException.class, () ->
                service.apply(OPP_ID, req, EMAIL));
    }

    // ── Batch mapping ────────────────────────────────────────────────

    @Test
    void listReceived_batchesFundingLookupIntoOneQuery() {
        User funder = opportunity.getFunder();
        when(userRepo.findByEmail("funder@example.com")).thenReturn(Optional.of(funder));

        Application linked1 = Application.builder()
                .id(1L).opportunity(opportunity).innovator(innovator).project(project)
                .ideaTitle("A").problemStatement("p").proposedSolution("s")
                .stage(ApplicationStage.SUBMITTED).build();
        Application linked2 = Application.builder()
                .id(2L).opportunity(opportunity).innovator(innovator).project(project)
                .ideaTitle("B").problemStatement("p").proposedSolution("s")
                .stage(ApplicationStage.SUBMITTED).build();
        Application unlinked = Application.builder()
                .id(3L).opportunity(opportunity).innovator(innovator)
                .ideaTitle("C").problemStatement("p").proposedSolution("s")
                .stage(ApplicationStage.SUBMITTED).build();
        when(applicationRepo.findAllByOpportunityFunderIdOrderByAppliedAtDesc(9L))
                .thenReturn(List.of(linked1, linked2, unlinked));

        List<ApplicationResponse> res = service.listReceived("funder@example.com");

        assertEquals(3, res.size());
        assertNotNull(res.get(0).linkedProject());
        assertNull(res.get(2).linkedProject());
        // Three rows, two distinct linked projects (same one twice) → exactly
        // ONE funding query. This is the N+1 guard.
        verify(applicationRepo, org.mockito.Mockito.times(1))
                .findAcceptedFundingForProjects(any());
    }
}
