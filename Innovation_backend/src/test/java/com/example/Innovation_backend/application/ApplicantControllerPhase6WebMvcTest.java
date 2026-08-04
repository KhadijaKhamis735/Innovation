package com.example.Innovation_backend.application;

import com.example.Innovation_backend.application.dto.ApplicationResponse;
import com.example.Innovation_backend.auth.WriteGuard;
import com.example.Innovation_backend.common.GlobalExceptionHandler;
import com.example.Innovation_backend.security.JwtAuthFilter;
import com.example.Innovation_backend.security.JwtService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase 6 — web-slice tests for the funder-side application surface that
 * drives mobile + web "Received Applications":
 *
 *   - GET  /api/applications/received          → funder-wide aggregate
 *   - PATCH /api/applications/{id}/stage       → stage move (verified gate)
 *
 * Asserts:
 *   - The new endpoint returns the service's flat list (no N+1 fan-out).
 *   - An empty result is a 200 with an empty array (not 404).
 *   - A non-funder / non-admin caller gets 403 (AccessDeniedException →
 *     403 via GlobalExceptionHandler).
 *   - The service was called with the right caller's email so the security
 *     boundary (owner-only rows) is exercised on the service side.
 *   - PATCH /api/applications/{id}/stage surfaces the canonical 7 stages
 *     and is gated by {@link WriteGuard}.
 *
 * Role-restriction coverage for the per-opportunity applicants route is
 * shared with the existing Phase 3B test and the full SpringBootTest
 * suite — this slice is focused on the new aggregate endpoint and the
 * stage-PATCH contract.
 */
@WebMvcTest(controllers = {ApplicantController.class})
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Import({GlobalExceptionHandler.class})
class ApplicantControllerPhase6WebMvcTest {

    @Autowired private MockMvc mvc;

    @MockBean private ApplicationService applicationService;
    @MockBean private WriteGuard writeGuard;
    @MockBean private JwtService jwtService;
    @MockBean private JwtAuthFilter jwtAuthFilter;

    private static final ApplicationResponse RECEIVED_APP_1 = new ApplicationResponse(
            100L, 10L, "Climate Tech Innovation Fund",
            7L,  "Alex Johnson", "alex@example.com",
            "Smart Water Monitor",
            "Rural communities need clean water.",
            "Solar-powered IoT monitors.",
            new BigDecimal("5000.00"),
            null, null,
            null, null, null, null, null, null, null, null,
            null, null, null,   // Phase 9: projectId, pitchNote, linkedProject
            ApplicationStage.UNDER_REVIEW,
            Instant.parse("2026-05-18T10:00:00Z"),
            Instant.parse("2026-05-18T10:00:00Z"));

    private static final ApplicationResponse RECEIVED_APP_2 = new ApplicationResponse(
            101L, 11L, "Past Grant",
            8L,  "Priya Mwangi", "priya@example.com",
            "EduBot Platform",
            "EdTech access gap.",
            "AI tutoring bot.",
            new BigDecimal("3000.00"),
            null, null,
            null, null, null, null, null, null, null, null,
            null, null, null,   // Phase 9: projectId, pitchNote, linkedProject
            ApplicationStage.ACCEPTED,
            Instant.parse("2026-05-12T10:00:00Z"),
            Instant.parse("2026-05-20T10:00:00Z"));

    @BeforeEach
    void setUp() {
        // Pre-fill SecurityContext with a FUNDER principal so the
        // controller's currentEmail() helper can read a name. Filters
        // are disabled, so the JWT pipeline is bypassed and the
        // SecurityContext is the only thing that matters here.
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "funder@example.com",
                        "n/a",
                        AuthorityUtils.createAuthorityList("ROLE_FUNDER"))
        );
        // Default: verification gate passes. Individual tests override to
        // simulate an unverified funder.
        doNothing().when(writeGuard).requireVerified();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ── GET /api/applications/received ───────────────────────────────

    @Test
    void received_returnsFlatListAcrossOwnedOpportunities() throws Exception {
        when(applicationService.listReceived("funder@example.com"))
                .thenReturn(List.of(RECEIVED_APP_1, RECEIVED_APP_2));

        mvc.perform(get("/api/applications/received"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].opportunityTitle").value("Climate Tech Innovation Fund"))
                .andExpect(jsonPath("$[0].stage").value("under_review"))
                .andExpect(jsonPath("$[0].innovatorName").value("Alex Johnson"))
                .andExpect(jsonPath("$[0].innovatorEmail").value("alex@example.com"))
                .andExpect(jsonPath("$[0].ideaTitle").value("Smart Water Monitor"))
                .andExpect(jsonPath("$[1].id").value(101))
                .andExpect(jsonPath("$[1].stage").value("accepted"));

        verify(applicationService, times(1)).listReceived("funder@example.com");
    }

    @Test
    void received_empty_returnsEmptyArray() throws Exception {
        when(applicationService.listReceived("funder@example.com")).thenReturn(List.of());

        mvc.perform(get("/api/applications/received"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void received_nonFunder_returns403() throws Exception {
        // A non-funder / non-admin principal must not be able to enumerate
        // other funders' applicants. The service throws AccessDeniedException
        // which GlobalExceptionHandler maps to 403.
        when(applicationService.listReceived(anyString()))
                .thenThrow(new AccessDeniedException(
                        "Only funders and admins can view received applications"));

        mvc.perform(get("/api/applications/received"))
                .andExpect(status().isForbidden());
    }

    // ── PATCH /api/applications/{id}/stage ───────────────────────────

    @Test
    void updateStage_underReview_succeeds() throws Exception {
        ApplicationResponse updated = new ApplicationResponse(
                100L, 10L, "Climate Tech Innovation Fund",
                7L, "Alex Johnson", "alex@example.com",
                "Smart Water Monitor",
                "Rural communities need clean water.",
                "Solar-powered IoT monitors.",
                new BigDecimal("5000.00"),
                null, null,
                null, null, null, null, null, null, null, null,
                null, null, null,   // Phase 9: projectId, pitchNote, linkedProject
                ApplicationStage.UNDER_REVIEW,
                Instant.parse("2026-05-18T10:00:00Z"),
                Instant.parse("2026-05-19T10:00:00Z"));

        when(applicationService.updateStage(eq(100L),
                eq(ApplicationStage.UNDER_REVIEW), eq("funder@example.com")))
                .thenReturn(updated);

        String body = """
                { "stage": "under_review" }
                """;

        mvc.perform(patch("/api/applications/100/stage")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.stage").value("under_review"));

        verify(writeGuard, times(1)).requireVerified();
        verify(applicationService, times(1))
                .updateStage(100L, ApplicationStage.UNDER_REVIEW, "funder@example.com");
    }

    @Test
    void updateStage_eachCanonicalStage_roundTrips() throws Exception {
        // Smoke-test every canonical stage so a future enum change breaks
        // a single test rather than slipping silently into production.
        for (ApplicationStage stage : new ApplicationStage[]{
                ApplicationStage.SUBMITTED,
                ApplicationStage.UNDER_REVIEW,
                ApplicationStage.INTERVIEW,
                ApplicationStage.PITCH,
                ApplicationStage.SHORTLISTED,
                ApplicationStage.ACCEPTED,
                ApplicationStage.REJECTED}) {

            when(applicationService.updateStage(eq(100L), eq(stage), eq("funder@example.com")))
                    .thenReturn(new ApplicationResponse(
                            100L, 10L, "Climate Tech Innovation Fund",
                            7L, "Alex Johnson", "alex@example.com",
                            "Smart Water Monitor", "p", "s",
                            new BigDecimal("5000.00"),
                            null, null,
                            null, null, null, null, null, null, null, null,
                            null, null, null,   // Phase 9: projectId, pitchNote, linkedProject
                            stage,
                            Instant.parse("2026-05-18T10:00:00Z"),
                            Instant.parse("2026-05-19T10:00:00Z")));

            String body = "{\"stage\":\"" + stage.json() + "\"}";

            mvc.perform(patch("/api/applications/100/stage")
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.stage").value(stage.json()));
        }
    }

    @Test
    void updateStage_unknownStage_returns400() throws Exception {
        String body = """
                { "stage": "definitely-not-a-stage" }
                """;

        mvc.perform(patch("/api/applications/100/stage")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());

        verify(applicationService, never()).updateStage(anyLongEq(), anyStage(), anyString());
    }

    @Test
    void updateStage_missingStage_returns400() throws Exception {
        // Empty body — @NotNull on StageUpdateRequest.stage rejects this.
        mvc.perform(patch("/api/applications/100/stage")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());

        verify(applicationService, never()).updateStage(anyLongEq(), anyStage(), anyString());
    }

    @Test
    void updateStage_unverified_returns403() throws Exception {
        doThrow(new AccessDeniedException(
                "Please verify your email before performing this action"))
                .when(writeGuard).requireVerified();

        String body = """
                { "stage": "interview" }
                """;

        mvc.perform(patch("/api/applications/100/stage")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());

        verify(applicationService, never()).updateStage(anyLongEq(), anyStage(), anyString());
    }

    @Test
    void updateStage_nonOwnerFunder_returns400() throws Exception {
        // Service throws IllegalArgumentException("Application not found: …")
        // when a non-owner tries to move someone else's applicant. The
        // important thing for this slice is that the controller didn't
        // bypass ownership and that the exception surfaces rather than
        // silently succeeding.
        when(applicationService.updateStage(eq(999L), anyStage(), eq("funder@example.com")))
                .thenThrow(new IllegalArgumentException("Application not found: 999"));

        String body = """
                { "stage": "interview" }
                """;

        mvc.perform(patch("/api/applications/999/stage")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    // ── Argument matcher helpers (Mockito's anyLong / any(ApplicationStage) clash) ──

    private static long anyLongEq() {
        return org.mockito.ArgumentMatchers.anyLong();
    }

    private static ApplicationStage anyStage() {
        return org.mockito.ArgumentMatchers.any(ApplicationStage.class);
    }
}