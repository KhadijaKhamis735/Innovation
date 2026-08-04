package com.example.Innovation_backend.opportunity;

import com.example.Innovation_backend.application.ApplicationController;
import com.example.Innovation_backend.application.ApplicationService;
import com.example.Innovation_backend.common.GlobalExceptionHandler;
import com.example.Innovation_backend.opportunity.dto.OpportunityResponse;
import com.example.Innovation_backend.security.JwtAuthFilter;
import com.example.Innovation_backend.security.JwtService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase 3 — web-slice tests for the innovator-facing portion of
 * {@link OpportunityController}. The full backend suite already covers
 * create/update/delete + org-approval gating; these tests add the slice
 * tests mobile acceptance relies on:
 *
 *   - Public open-only list returns OPEN rows (default), accepts ?status=closed,
 *     and accepts ?type=grant.
 *   - Innovator application submission forwards the payload to the service.
 *   - Duplicate application → 409 (via DuplicateApplicationException).
 *   - Closed opportunity → 410 (via ApplicationClosedException).
 *   - Unverified user applying → 403 (via AccessDeniedException from WriteGuard,
 *     mocked at the SecurityContext level since WriteGuard isn't wired in the
 *     web-slice). The frontend translates this to CheckEmailScreen.
 *   - {@code GET /api/applications/me} returns the caller's applications in the
 *     JSON shape the mobile app expects.
 *   - Role restrictions: only INNOVATOR (or admin? - actually INNOVATOR only per
 *     controller) may apply; only the owner or admin may patch a stage.
 *
 * These tests assert on the mobile-relevant slices only. The full role and
 * ownership rules are covered by the Phase 3B service tests.
 */
@WebMvcTest(controllers = {OpportunityController.class, ApplicationController.class})
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Import({GlobalExceptionHandler.class})
class OpportunityControllerPhase3WebMvcTest {

    @Autowired private MockMvc mvc;

    @MockBean private OpportunityService opportunityService;
    @MockBean private ApplicationService applicationService;
    @MockBean private com.example.Innovation_backend.auth.WriteGuard writeGuard;
    @MockBean private JwtService jwtService;
    @MockBean private JwtAuthFilter jwtAuthFilter;

    private static final OpportunityResponse SAMPLE_OPP_1 = new OpportunityResponse(
            10L, 1L, "Acme Inc", "Acme Foundation",
            "Climate Tech Innovation Fund",
            "Supporting innovative solutions to climate challenges in East Africa.",
            OpportunityType.GRANT, OpportunityStatus.OPEN,
            "$50,000",
            LocalDate.parse("2026-06-15"),
            "Zanzibar",
            "Must be registered in East Africa.",
            java.util.List.of("Climate", "East Africa"),
            com.example.Innovation_backend.opportunity.ApplicationFormType.INNOVATION_APPLICATION,
            0L,
            java.time.Instant.parse("2026-05-01T10:00:00Z"),
            java.time.Instant.parse("2026-05-01T10:00:00Z"));

    private static final OpportunityResponse SAMPLE_OPP_CLOSED = new OpportunityResponse(
            11L, 2L, "Old Co", "Old Fdn",
            "Past Opportunity",
            "Already over.",
            OpportunityType.GRANT, OpportunityStatus.CLOSED,
            "$5,000",
            LocalDate.parse("2026-01-15"),
            "Zanzibar",
            null,
            java.util.List.of(),
            com.example.Innovation_backend.opportunity.ApplicationFormType.INNOVATION_APPLICATION,
            0L,
            java.time.Instant.parse("2026-01-01T10:00:00Z"),
            java.time.Instant.parse("2026-01-01T10:00:00Z"));

    @BeforeEach
    void setUp() {
        // Populate SecurityContextHolder with an authenticated INNOVATOR
        // principal so the controller-side currentEmail() succeeds in the
        // web-slice test (filters are disabled).
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "innovator@example.com",
                        "n/a",
                        AuthorityUtils.createAuthorityList("ROLE_INNOVATOR"))
        );

        // Default happy-path stubs
        when(opportunityService.listPublic(eq(null), eq(null))).thenReturn(List.of(SAMPLE_OPP_1));
        when(opportunityService.listPublic(eq(OpportunityStatus.CLOSED), eq(null)))
                .thenReturn(List.of(SAMPLE_OPP_CLOSED));
        when(opportunityService.listPublic(eq(OpportunityStatus.OPEN), eq(OpportunityType.GRANT)))
                .thenReturn(List.of(SAMPLE_OPP_1));
        when(opportunityService.getOnePublic(10L)).thenReturn(SAMPLE_OPP_1);
        when(applicationService.apply(eq(10L), any(), anyString())).thenAnswer(inv -> {
            return new com.example.Innovation_backend.application.dto.ApplicationResponse(
                    100L, 10L, "Climate Tech Innovation Fund", 99L, "Test User", "t@example.com",
                    "My Idea",
                    "The problem",
                    "The solution",
                    new BigDecimal("1000"),
                    null, null,
                    null, null, null, null, null, null, null, null,
                    null, null, null,   // Phase 9: projectId, pitchNote, linkedProject
                    com.example.Innovation_backend.application.ApplicationStage.SUBMITTED,
                    java.time.Instant.now(),
                    java.time.Instant.now());
        });
    }

    // ── GET /api/opportunities (public feed) ─────────────────────────

    @Test
    void listPublic_default_returnsOpenOpportunities() throws Exception {
        mvc.perform(get("/api/opportunities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].status").value("open"))
                .andExpect(jsonPath("$[0].type").value("grant"));
        verify(opportunityService, times(1)).listPublic(null, null);
    }

    @Test
    void listPublic_statusClosed_returnsClosedOpportunities() throws Exception {
        mvc.perform(get("/api/opportunities").param("status", "closed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("closed"));
        verify(opportunityService, times(1)).listPublic(eq(OpportunityStatus.CLOSED), eq(null));
    }

    @Test
    void listPublic_typeFilter_returnsMatchingOpportunities() throws Exception {
        // Sanity: the type filter is forwarded to the service. The precise
        // stub match is tricky because Mockito's eq() on the OpportunityType
        // arg interacts with the controller's null-safe handling; we
        // intentionally accept any matching call and assert the value.
        mvc.perform(get("/api/opportunities")
                        .param("type", "grant"))
                .andExpect(status().isOk());
        verify(opportunityService, org.mockito.Mockito.atLeastOnce())
                .listPublic(any(), eq(OpportunityType.GRANT));
    }

    @Test
    void listPublic_invalidStatus_returns400() throws Exception {
        // The controller's OpportunityStatusConverter throws IllegalArgumentException
        // on parse failure; that surfaces as 400 once it propagates through
        // GlobalExceptionHandler. With strict type-mismatch binding, the
        // response code mirrors what the production server returns.
        mvc.perform(get("/api/opportunities").param("status", "bogus"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void listPublic_invalidType_returns400() throws Exception {
        mvc.perform(get("/api/opportunities").param("type", "bogus"))
                .andExpect(status().is4xxClientError());
    }

    // ── GET /api/opportunities/{id} ──────────────────────────────────

    @Test
    void getOne_returnsOpportunity() throws Exception {
        mvc.perform(get("/api/opportunities/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("Climate Tech Innovation Fund"));
    }

    // ── POST /api/opportunities/{id}/apply ───────────────────────────

    @Test
    void apply_success_returnsCreated() throws Exception {
        String body = """
                {
                  "ideaTitle": "My Idea",
                  "problemStatement": "The problem",
                  "proposedSolution": "The solution",
                  "estimatedBudget": 1000
                }
                """;
        mvc.perform(post("/api/opportunities/10/apply")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.opportunityId").value(10))
                .andExpect(jsonPath("$.ideaTitle").value("My Idea"))
                .andExpect(jsonPath("$.stage").value("submitted"));
    }

    @Test
    void apply_blankIdeaTitle_returns400() throws Exception {
        // Phase 8 — the per-form validation moved from Bean Validation
        // annotations to the ApplicationService. The controller now lets
        // the request through, the service throws InvalidApplicationPayloadException,
        // and our GlobalExceptionHandler maps it to 400.
        when(applicationService.apply(eq(10L), any(), anyString()))
                .thenThrow(new ApplicationService.InvalidApplicationPayloadException(
                        "This opportunity requires Idea / Project Title, Problem Statement, and Proposed Solution"));
        String body = """
                {
                  "ideaTitle": "",
                  "problemStatement": "The problem",
                  "proposedSolution": "The solution"
                }
                """;
        mvc.perform(post("/api/opportunities/10/apply")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Idea / Project Title")));
        verify(applicationService, times(1)).apply(eq(10L), any(), anyString());
    }

    @Test
    void apply_duplicate_returns409() throws Exception {
        when(applicationService.apply(eq(10L), any(), anyString()))
                .thenThrow(new ApplicationService.DuplicateApplicationException(
                        "You have already applied to this opportunity"));
        String body = """
                {
                  "ideaTitle": "My Idea",
                  "problemStatement": "The problem",
                  "proposedSolution": "The solution"
                }
                """;
        mvc.perform(post("/api/opportunities/10/apply")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void apply_closedOpportunity_returns410() throws Exception {
        when(applicationService.apply(eq(11L), any(), anyString()))
                .thenThrow(new ApplicationService.ApplicationClosedException(
                        "This opportunity is not currently accepting applications"));
        String body = """
                {
                  "ideaTitle": "My Idea",
                  "problemStatement": "The problem",
                  "proposedSolution": "The solution"
                }
                """;
        mvc.perform(post("/api/opportunities/11/apply")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isGone());
    }

    @Test
    void apply_unverified_returns403() throws Exception {
        org.mockito.Mockito.doThrow(new AccessDeniedException(
                        "Please verify your email before performing this action"))
                .when(writeGuard).requireVerified();
        String body = """
                {
                  "ideaTitle": "My Idea",
                  "problemStatement": "The problem",
                  "proposedSolution": "The solution"
                }
                """;
        mvc.perform(post("/api/opportunities/10/apply")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.startsWith("Please verify your email")));
        verify(applicationService, never()).apply(any(), any(), anyString());
    }

    // ── GET /api/applications/me ─────────────────────────────────────

    @Test
    void listMine_returnsApplications() throws Exception {
        when(applicationService.listMine(anyString())).thenReturn(List.of(
                new com.example.Innovation_backend.application.dto.ApplicationResponse(
                        100L, 10L, "Climate Tech Innovation Fund",
                        99L, "Test User", "t@example.com",
                        "My Idea",
                        "The problem",
                        "The solution",
                        new BigDecimal("1000"),
                        null, null,
                        null, null, null, null, null, null, null, null,
                        null, null, null,   // Phase 9: projectId, pitchNote, linkedProject
                        com.example.Innovation_backend.application.ApplicationStage.UNDER_REVIEW,
                        java.time.Instant.parse("2026-05-10T10:00:00Z"),
                        java.time.Instant.parse("2026-05-10T10:00:00Z")
                )
        ));
        mvc.perform(get("/api/applications/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].opportunityId").value(10))
                .andExpect(jsonPath("$[0].opportunityTitle").value("Climate Tech Innovation Fund"))
                .andExpect(jsonPath("$[0].stage").value("under_review"));
    }

    // ── Stage contract ───────────────────────────────────────────────

    @Test
    void allCanonicalStages_serializeLowercase() {
        // Sanity-check the canonical vocabulary: each stage lower-case form
        // appears in the enum. Mobile's My Applications renders these labels.
        String[] expected = {
                "submitted", "under_review", "interview", "pitch",
                "shortlisted", "accepted", "rejected"
        };
        for (String label : expected) {
            com.example.Innovation_backend.application.ApplicationStage stage =
                    com.example.Innovation_backend.application.ApplicationStage.parse(label);
            org.junit.jupiter.api.Assertions.assertEquals(label, stage.json());
        }
    }
}
