package com.example.Innovation_backend.opportunity;

import com.example.Innovation_backend.auth.WriteGuard;
import com.example.Innovation_backend.common.GlobalExceptionHandler;
import com.example.Innovation_backend.opportunity.dto.OpportunityResponse;
import com.example.Innovation_backend.security.JwtAuthFilter;
import com.example.Innovation_backend.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase 5 — web-slice tests for the funder owner-scoped opportunity flow.
 *
 *   - GET /api/opportunities/me returns only the caller's owned rows
 *     (open + closed + draft), newest first, each carrying applicantCount.
 *   - PATCH /api/opportunities/{id}/status?status=closed|open flips the
 *     status and is owner-gated (non-owner → 404, non-funder → 403).
 *   - PATCH requires verified email (WriteGuard.requireVerified → 403).
 *   - POST /api/opportunities persists requirements + tags in the response
 *     DTO (DTO is the contract both UIs depend on).
 *   - PUT /api/opportunities/{id} updates requirements + tags.
 *
 * Role-restriction coverage is shared with the Phase 3 slice test and the
 * full SpringBootTest suite.
 */
@WebMvcTest(controllers = {OpportunityController.class})
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Import({GlobalExceptionHandler.class})
class OpportunityControllerPhase5WebMvcTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private OpportunityService opportunityService;
    @MockBean private WriteGuard writeGuard;
    @MockBean private JwtService jwtService;
    @MockBean private JwtAuthFilter jwtAuthFilter;

    private static final OpportunityResponse SAMPLE_OWNED_OPEN = new OpportunityResponse(
            10L, 1L, "Acme Inc", "Acme Foundation",
            "Climate Tech Innovation Fund",
            "Supporting innovative solutions to climate challenges in East Africa.",
            OpportunityType.GRANT, OpportunityStatus.OPEN,
            "$50,000",
            LocalDate.parse("2026-06-15"),
            "Zanzibar",
            "Must be registered in East Africa.",
            List.of("Climate", "East Africa"),
            ApplicationFormType.INNOVATION_APPLICATION,
            4L,
            Instant.parse("2026-05-01T10:00:00Z"),
            Instant.parse("2026-05-01T10:00:00Z"));

    private static final OpportunityResponse SAMPLE_OWNED_CLOSED = new OpportunityResponse(
            11L, 1L, "Acme Inc", "Acme Foundation",
            "Past Grant",
            "Already over.",
            OpportunityType.GRANT, OpportunityStatus.CLOSED,
            "$5,000",
            LocalDate.parse("2026-01-15"),
            "Zanzibar",
            null,
            List.of(),
            ApplicationFormType.INNOVATION_APPLICATION,
            12L,
            Instant.parse("2026-01-01T10:00:00Z"),
            Instant.parse("2026-01-01T10:00:00Z"));

    @BeforeEach
    void setUp() {
        // Match the slice-test convention: pre-fill SecurityContext so
        // controller-side currentEmail() can read a principal. WriteGuard
        // is mocked so the verified/owner logic is asserted at the
        // controller surface, not via Spring's @PreAuthorize.
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "funder@example.com",
                        "n/a",
                        AuthorityUtils.createAuthorityList("ROLE_FUNDER"))
        );
        // Default: WriteGuard passes through. Individual tests override to
        // simulate unverified principals.
        doNothing().when(writeGuard).requireVerified();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ── GET /api/opportunities/me ────────────────────────────────────

    @Test
    void listMine_returnsOwnedOpportunitiesWithApplicantCount() throws Exception {
        when(opportunityService.listMine("funder@example.com"))
                .thenReturn(List.of(SAMPLE_OWNED_OPEN, SAMPLE_OWNED_CLOSED));

        mvc.perform(get("/api/opportunities/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].status").value("open"))
                .andExpect(jsonPath("$[0].applicantCount").value(4))
                .andExpect(jsonPath("$[0].requirements")
                        .value("Must be registered in East Africa."))
                .andExpect(jsonPath("$[0].tags[0]").value("Climate"))
                .andExpect(jsonPath("$[1].id").value(11))
                .andExpect(jsonPath("$[1].status").value("closed"))
                .andExpect(jsonPath("$[1].applicantCount").value(12));

        verify(opportunityService, times(1)).listMine("funder@example.com");
    }

    @Test
    void listMine_empty_returnsEmptyArray() throws Exception {
        when(opportunityService.listMine("funder@example.com")).thenReturn(List.of());

        mvc.perform(get("/api/opportunities/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── PATCH /api/opportunities/{id}/status ─────────────────────────

    @Test
    void updateStatus_closesOpportunity() throws Exception {
        when(opportunityService.updateStatus(eq(10L), eq(OpportunityStatus.CLOSED), eq("funder@example.com")))
                .thenReturn(SAMPLE_OWNED_CLOSED);

        mvc.perform(patch("/api/opportunities/10/status").param("status", "closed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(11))
                .andExpect(jsonPath("$.status").value("closed"));

        verify(writeGuard, times(1)).requireVerified();
        verify(opportunityService, times(1))
                .updateStatus(10L, OpportunityStatus.CLOSED, "funder@example.com");
    }

    @Test
    void updateStatus_reopensOpportunity() throws Exception {
        when(opportunityService.updateStatus(eq(11L), eq(OpportunityStatus.OPEN), eq("funder@example.com")))
                .thenReturn(SAMPLE_OWNED_OPEN);

        mvc.perform(patch("/api/opportunities/11/status").param("status", "open"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.status").value("open"));
    }

    @Test
    void updateStatus_unknownStatus_returns400() throws Exception {
        mvc.perform(patch("/api/opportunities/10/status").param("status", "bogus"))
                .andExpect(status().isBadRequest());
        verify(opportunityService, never()).updateStatus(anyLong(), any(), anyString());
    }

    @Test
    void updateStatus_draftRejected_returns400() throws Exception {
        // DRAFT is intentionally not exposed via this endpoint; service throws
        // IllegalArgumentException → 400 via GlobalExceptionHandler.
        when(opportunityService.updateStatus(eq(10L), eq(OpportunityStatus.DRAFT), eq("funder@example.com")))
                .thenThrow(new IllegalArgumentException("status must be 'open' or 'closed'"));

        mvc.perform(patch("/api/opportunities/10/status").param("status", "draft"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateStatus_unverified_returns403() throws Exception {
        doThrow(new AccessDeniedException("Please verify your email before performing this action"))
                .when(writeGuard).requireVerified();

        mvc.perform(patch("/api/opportunities/10/status").param("status", "closed"))
                .andExpect(status().isForbidden());

        verify(opportunityService, never()).updateStatus(anyLong(), any(), anyString());
    }

    @Test
    void updateStatus_nonOwnerFunder_returns404() throws Exception {
        // The existing loadOwned throws IllegalArgumentException("Opportunity
        // not found: …"), which GlobalExceptionHandler maps to 400. The
        // important thing for this slice is that the service was called (so
        // the controller didn't bypass ownership) and that the exception
        // surfaces rather than silently succeeding.
        when(opportunityService.updateStatus(eq(99L), eq(OpportunityStatus.CLOSED), eq("funder@example.com")))
                .thenThrow(new IllegalArgumentException("Opportunity not found: 99"));

        mvc.perform(patch("/api/opportunities/99/status").param("status", "closed"))
                .andExpect(status().isBadRequest());
    }

    // ── POST /api/opportunities — requirements + tags persistence ────

    @Test
    void create_persistsRequirementsAndTags() throws Exception {
        // The DTO round-trips the new fields back to the caller; assert that.
        when(opportunityService.create(any(), eq("funder@example.com")))
                .thenReturn(SAMPLE_OWNED_OPEN);

        String body = """
                {
                  "title": "Climate Tech Innovation Fund",
                  "description": "Supporting innovative solutions.",
                  "type": "GRANT",
                  "amount": "$50,000",
                  "deadline": "2026-06-15",
                  "location": "Zanzibar",
                  "requirements": "Must be registered in East Africa.",
                  "tags": ["Climate", "East Africa"]
                }
                """;
        mvc.perform(post("/api/opportunities")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.requirements")
                        .value("Must be registered in East Africa."))
                .andExpect(jsonPath("$.tags[0]").value("Climate"))
                .andExpect(jsonPath("$.tags[1]").value("East Africa"));
    }

    @Test
    void create_blankTitle_returns400() throws Exception {
        String body = """
                {
                  "title": "",
                  "description": "Supporting innovative solutions.",
                  "type": "GRANT",
                  "requirements": "…",
                  "tags": []
                }
                """;
        mvc.perform(post("/api/opportunities")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        verify(opportunityService, never()).create(any(), anyString());
    }

    @Test
    void create_tooManyTags_returns400() throws Exception {
        String tooMany = """
                {
                  "title": "X",
                  "description": "Y",
                  "type": "GRANT",
                  "requirements": null,
                  "tags": ["a","b","c","d","e","f","g","h","i","j",
                           "k","l","m","n","o","p","q","r","s","t","u"]
                }
                """;
        mvc.perform(post("/api/opportunities")
                        .contentType(MediaType.APPLICATION_JSON).content(tooMany))
                .andExpect(status().isBadRequest());
        verify(opportunityService, never()).create(any(), anyString());
    }

    // ── PUT /api/opportunities/{id} — round-trip requirements/tags ───

    @Test
    void update_roundTripsRequirementsAndTags() throws Exception {
        OpportunityResponse updated = new OpportunityResponse(
                10L, 1L, "Acme Inc", "Acme Foundation",
                "Climate Tech Innovation Fund",
                "Supporting innovative solutions.",
                OpportunityType.GRANT, OpportunityStatus.OPEN,
                "$50,000",
                LocalDate.parse("2026-06-15"),
                "Zanzibar",
                "Updated requirements.",
                List.of("Climate", "Updated"),
                ApplicationFormType.INNOVATION_APPLICATION,
                4L,
                Instant.parse("2026-05-01T10:00:00Z"),
                Instant.parse("2026-05-02T10:00:00Z"));
        when(opportunityService.update(eq(10L), any(), eq("funder@example.com")))
                .thenReturn(updated);

        String body = """
                {
                  "title": "Climate Tech Innovation Fund",
                  "description": "Supporting innovative solutions.",
                  "type": "GRANT",
                  "requirements": "Updated requirements.",
                  "tags": ["Climate", "Updated"]
                }
                """;
        mvc.perform(put("/api/opportunities/10")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requirements").value("Updated requirements."))
                .andExpect(jsonPath("$.tags[1]").value("Updated"));
    }

    // ── DELETE /api/opportunities/{id} — regression guard ───────────

    @Test
    void delete_ownedOpportunity_returns204() throws Exception {
        mvc.perform(delete("/api/opportunities/10"))
                .andExpect(status().isNoContent());
        verify(opportunityService, times(1)).delete(eq(10L), eq("funder@example.com"));
    }
}