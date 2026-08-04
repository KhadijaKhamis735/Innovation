package com.example.Innovation_backend.project;

import com.example.Innovation_backend.security.JwtAuthFilter;
import com.example.Innovation_backend.security.JwtService;
import com.example.Innovation_backend.auth.WriteGuard;
import com.example.Innovation_backend.common.GlobalExceptionHandler;
import com.example.Innovation_backend.project.attachment.AttachmentKind;
import com.example.Innovation_backend.project.attachment.LimitExceededException;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentController;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentService;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentResponse;
import com.example.Innovation_backend.project.attachment.StorageException;
import com.example.Innovation_backend.project.dto.MilestoneRequest;
import com.example.Innovation_backend.project.dto.MilestoneResponse;
import com.example.Innovation_backend.project.dto.ProjectRequest;
import com.example.Innovation_backend.project.dto.ProjectResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase 4 — web-slice tests for the innovator-facing portion of the
 * unified project controller + attachment controller. These tests add
 * the contract slice the React Native mobile client relies on:
 *
 *   - GET /api/projects/me returns the caller's innovation projects.
 *   - POST /api/projects creates a project; verified-email guard → 403;
 *     zsaId / approvalStatus are not client-settable.
 *   - PUT /api/projects/{id} updates; verified-email guard → 403.
 *   - PATCH /api/projects/{id}/phase accepts only the 5 canonical phases;
 *     bad phase → 400.
 *   - DELETE /api/projects/{id} removes; verified-email guard → 403.
 *   - Milestones: POST adds, PATCH toggles completed (+ stamps completedDate),
 *     DELETE removes; cross-owner delete → 404.
 *   - Attachments: POST multipart uploads; 6th file → 422 LimitExceeded;
 *     verified-email guard → 403; GET streams bytes with Content-Type,
 *     Content-Length, RFC 5987 Content-Disposition; ownership denies
 *     cross-user download; DELETE 204 + file removed.
 *
 * Mirrors the WebMvc test pattern in
 * {@link com.example.Innovation_backend.opportunity.OpportunityControllerPhase3WebMvcTest}.
 */
@WebMvcTest(controllers = {ProjectController.class, ProjectAttachmentController.class})
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Import({GlobalExceptionHandler.class})
class ProjectControllerPhase4WebMvcTest {

    @Autowired private MockMvc mvc;

    @MockBean private ProjectService projectService;
    @MockBean private MilestoneService milestoneService;
    @MockBean private ProjectAttachmentService attachmentService;
    @MockBean private com.example.Innovation_backend.project.attachment.ProjectAttachmentRepository attachmentRepo;
    @MockBean private WriteGuard writeGuard;
    @MockBean private JwtService jwtService;
    @MockBean private JwtAuthFilter jwtAuthFilter;

    private static final String CALLER_EMAIL = "innovator@example.com";

    private static final ProjectResponse SAMPLE_PROJECT = new ProjectResponse(
            42L,
            ProjectSurface.INNOVATION,
            "Smart Water Monitor",
            "Low-cost IoT water quality probe",
            "Sensors + LoRa backhaul",
            "AgriTech",
            ProjectPhase.PROTOTYPE,
            List.of("iot", "water"),
            LocalDate.parse("2026-01-15"),
            null,                                         // zsaId (PENDING)
            ProjectApprovalStatus.PENDING,
            7L, null, "Test User",
            null, null, null, null,
            List.of(new MilestoneResponse(
                    1L, "Problem statement", null, true,
                    LocalDate.parse("2026-01-20"), 0,
                    Instant.parse("2026-01-15T10:00:00Z"),
                    Instant.parse("2026-01-20T10:00:00Z"))),
            List.of(),                                  // evidence (no rows on the SAMPLE_PROJECT)
            Instant.parse("2026-01-15T10:00:00Z"),
            Instant.parse("2026-01-20T10:00:00Z"));

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        CALLER_EMAIL,
                        "n/a",
                        AuthorityUtils.createAuthorityList("ROLE_INNOVATOR")));
        // Default: WriteGuard is a no-op so writes succeed unless a test
        // stubs it to throw. The Mockito @MockBean gives a no-op by default.
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ── GET /api/projects/me ────────────────────────────────────────

    @Test
    void listMine_returnsInnovationProjects() throws Exception {
        when(projectService.listMine(CALLER_EMAIL)).thenReturn(List.of(SAMPLE_PROJECT));

        mvc.perform(get("/api/projects/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(42))
                .andExpect(jsonPath("$[0].surface").value("innovation"))
                .andExpect(jsonPath("$[0].name").value("Smart Water Monitor"))
                .andExpect(jsonPath("$[0].phase").value("prototype"))
                .andExpect(jsonPath("$[0].approvalStatus").value("pending"))
                .andExpect(jsonPath("$[0].zsaId").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$[0].ownerUserId").value(7))
                .andExpect(jsonPath("$[0].milestones[0].completed").value(true))
                .andExpect(jsonPath("$[0].milestones[0].completedDate").value("2026-01-20"));
        verify(projectService, times(1)).listMine(CALLER_EMAIL);
    }

    @Test
    void listMine_emptyArrayIsValid() throws Exception {
        when(projectService.listMine(CALLER_EMAIL)).thenReturn(List.of());

        mvc.perform(get("/api/projects/me"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    // ── POST /api/projects ──────────────────────────────────────────

    @Test
    void create_validPayload_returns201_andPassesToService() throws Exception {
        when(projectService.create(any(ProjectRequest.class), eq(CALLER_EMAIL)))
                .thenReturn(SAMPLE_PROJECT);

        String body = """
                {
                  "name": "Smart Water Monitor",
                  "tagline": "Low-cost IoT water quality probe",
                  "description": "Sensors + LoRa backhaul",
                  "category": "AgriTech",
                  "phase": "prototype",
                  "startDate": "2026-01-15",
                  "tags": ["iot", "water"]
                }
                """;
        mvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.surface").value("innovation"))
                .andExpect(jsonPath("$.approvalStatus").value("pending"));
        verify(projectService, times(1)).create(any(ProjectRequest.class), eq(CALLER_EMAIL));
    }

    @Test
    void create_blankName_returns400() throws Exception {
        String body = """
                { "name": "", "phase": "idea" }
                """;
        mvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        verify(projectService, never()).create(any(), anyString());
    }

    @Test
    void create_missingPhase_returns400() throws Exception {
        String body = """
                { "name": "Just a name" }
                """;
        mvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        verify(projectService, never()).create(any(), anyString());
    }

    @Test
    void create_unverified_returns403() throws Exception {
        doThrow(new AccessDeniedException(
                        "Please verify your email before performing this action"))
                .when(writeGuard).requireVerified();

        String body = """
                { "name": "Smart Water Monitor", "phase": "idea" }
                """;
        mvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message")
                        .value(org.hamcrest.Matchers.startsWith("Please verify your email")));
        verify(projectService, never()).create(any(), anyString());
    }

    // ── GET /api/projects/{id} ──────────────────────────────────────

    @Test
    void getOne_returnsProject() throws Exception {
        when(projectService.getOne(eq(42L), anyString(), any())).thenReturn(SAMPLE_PROJECT);

        mvc.perform(get("/api/projects/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.name").value("Smart Water Monitor"));
    }

    @Test
    void getOne_notFound_returns404() throws Exception {
        when(projectService.getOne(eq(999L), anyString(), any()))
                .thenThrow(new EntityNotFoundException("Project not found: 999"));

        mvc.perform(get("/api/projects/999"))
                .andExpect(status().isNotFound());
    }

    // ── PUT /api/projects/{id} ──────────────────────────────────────

    @Test
    void update_validPayload_returns200_andPassesToService() throws Exception {
        when(projectService.update(eq(42L), any(ProjectRequest.class), eq(CALLER_EMAIL)))
                .thenReturn(SAMPLE_PROJECT);

        String body = """
                {
                  "name": "Renamed Project",
                  "phase": "prototype",
                  "tags": ["iot"]
                }
                """;
        mvc.perform(put("/api/projects/42")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42));
        verify(projectService, times(1)).update(eq(42L), any(ProjectRequest.class), eq(CALLER_EMAIL));
    }

    @Test
    void update_unverified_returns403() throws Exception {
        doThrow(new AccessDeniedException(
                        "Please verify your email before performing this action"))
                .when(writeGuard).requireVerified();

        String body = """
                { "name": "Renamed Project", "phase": "idea" }
                """;
        mvc.perform(put("/api/projects/42")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        verify(projectService, never()).update(anyLong(), any(), anyString());
    }

    // ── PATCH /api/projects/{id}/phase ──────────────────────────────

    @Test
    void updatePhase_validPhase_returns200() throws Exception {
        when(projectService.updatePhase(eq(42L), eq(ProjectPhase.PROTOTYPE), eq(CALLER_EMAIL)))
                .thenReturn(SAMPLE_PROJECT);

        mvc.perform(patch("/api/projects/42/phase").param("phase", "prototype"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42));
    }

    @Test
    void updatePhase_invalidPhase_returns400() throws Exception {
        // The controller's ProjectPhaseConverter throws
        // IllegalArgumentException on a parse failure; GlobalExceptionHandler
        // maps that to 400. The service must NOT be called.
        mvc.perform(patch("/api/projects/42/phase").param("phase", "not-a-phase"))
                .andExpect(status().isBadRequest());
        verify(projectService, never()).updatePhase(anyLong(), any(), anyString());
    }

    @Test
    void updatePhase_unverified_returns403() throws Exception {
        doThrow(new AccessDeniedException(
                        "Please verify your email before performing this action"))
                .when(writeGuard).requireVerified();

        mvc.perform(patch("/api/projects/42/phase").param("phase", "prototype"))
                .andExpect(status().isForbidden());
        verify(projectService, never()).updatePhase(anyLong(), any(), anyString());
    }

    @Test
    void updatePhase_evidenceRequired_returns400() throws Exception {
        // ProjectService rejects PROTOTYPE/MVP without evidence via
        // IllegalArgumentException; GlobalExceptionHandler maps it to 400 and
        // the web client renders the message verbatim.
        when(projectService.updatePhase(eq(42L), eq(ProjectPhase.MVP), eq(CALLER_EMAIL)))
                .thenThrow(new IllegalArgumentException(
                        "Evidence is required to move this project to the mvp stage. "
                                + "Upload a file or add a link first."));

        mvc.perform(patch("/api/projects/42/phase").param("phase", "mvp"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value(org.hamcrest.Matchers.containsString("Evidence is required")));
    }

    // ── DELETE /api/projects/{id} ───────────────────────────────────

    @Test
    void delete_returns204() throws Exception {
        mvc.perform(delete("/api/projects/42"))
                .andExpect(status().isNoContent());
        verify(projectService, times(1)).delete(eq(42L), eq(CALLER_EMAIL));
    }

    @Test
    void delete_unverified_returns403() throws Exception {
        doThrow(new AccessDeniedException(
                        "Please verify your email before performing this action"))
                .when(writeGuard).requireVerified();

        mvc.perform(delete("/api/projects/42"))
                .andExpect(status().isForbidden());
        verify(projectService, never()).delete(anyLong(), anyString());
    }

    // ── Milestones ──────────────────────────────────────────────────

    @Test
    void addMilestone_valid_returns200() throws Exception {
        when(milestoneService.add(eq(42L), any(MilestoneRequest.class), eq(CALLER_EMAIL)))
                .thenReturn(SAMPLE_PROJECT);

        String body = """
                { "name": "Beta testing", "description": "Run closed beta", "completed": false }
                """;
        mvc.perform(post("/api/projects/42/milestones")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42));
    }

    @Test
    void addMilestone_blankName_returns400() throws Exception {
        // POST requires a non-blank name; the controller enforces this
        // explicitly because @NotBlank on MilestoneRequest was dropped
        // (so PATCH can be partial).
        String body = """
                { "name": "" }
                """;
        mvc.perform(post("/api/projects/42/milestones")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        verify(milestoneService, never()).add(anyLong(), any(), anyString());
    }

    @Test
    void addMilestone_unverified_returns403() throws Exception {
        doThrow(new AccessDeniedException(
                        "Please verify your email before performing this action"))
                .when(writeGuard).requireVerified();

        String body = """
                { "name": "Beta testing" }
                """;
        mvc.perform(post("/api/projects/42/milestones")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        verify(milestoneService, never()).add(anyLong(), any(), anyString());
    }

    @Test
    void updateMilestone_returnsUpdatedMilestone() throws Exception {
        MilestoneResponse updated = new MilestoneResponse(
                1L, "Problem statement", null, true,
                LocalDate.parse("2026-01-20"), 0,
                Instant.parse("2026-01-15T10:00:00Z"),
                Instant.parse("2026-01-20T10:00:00Z"));
        when(milestoneService.update(eq(1L), any(MilestoneRequest.class), eq(CALLER_EMAIL)))
                .thenReturn(updated);

        String body = """
                { "completed": true }
                """;
        mvc.perform(patch("/api/projects/42/milestones/1")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.completed").value(true));
    }

    @Test
    void deleteMilestone_returns204() throws Exception {
        mvc.perform(delete("/api/projects/42/milestones/1"))
                .andExpect(status().isNoContent());
        verify(milestoneService, times(1)).delete(eq(1L), eq(CALLER_EMAIL));
    }

    @Test
    void deleteMilestone_notFound_returns404() throws Exception {
        org.mockito.Mockito.doThrow(new EntityNotFoundException("Milestone not found: 999"))
                .when(milestoneService).delete(eq(999L), eq(CALLER_EMAIL));

        mvc.perform(delete("/api/projects/42/milestones/999"))
                .andExpect(status().isNotFound());
    }

    // ── Attachments: list ───────────────────────────────────────────

    @Test
    void listAttachments_returnsMetadata() throws Exception {
        when(attachmentService.list(eq(42L), eq(CALLER_EMAIL)))
                .thenReturn(List.of(new ProjectAttachmentResponse(
                        100L, 42L, "prototype-photo.png", "image/png", 1024L,
                        AttachmentKind.EVIDENCE, "first prototype",
                        "file", null,
                        7L, null, "Test User",
                        Instant.parse("2026-02-01T10:00:00Z"))));

        mvc.perform(get("/api/projects/42/attachments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].originalFilename").value("prototype-photo.png"))
                .andExpect(jsonPath("$[0].mimeType").value("image/png"))
                .andExpect(jsonPath("$[0].kind").value("evidence"))
                .andExpect(jsonPath("$[0].type").value("file"))
                .andExpect(jsonPath("$[0].uploadedByUserId").value(7));
    }

    // ── Attachments: upload ─────────────────────────────────────────

    @Test
    void uploadAttachment_valid_returns201() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "prototype.png", "image/png", "fake-png-bytes".getBytes());
        // `kind` arrives as a JSON-quoted part from typed clients; the
        // controller strips the quotes before parsing the enum.
        MockMultipartFile kind = new MockMultipartFile(
                "kind", "kind", MediaType.APPLICATION_JSON_VALUE, "\"evidence\"".getBytes());

        when(attachmentService.upload(eq(42L), any(), eq(AttachmentKind.EVIDENCE), isNull(), eq(CALLER_EMAIL)))
                .thenReturn(new ProjectAttachmentResponse(
                        100L, 42L, "prototype.png", "image/png", 15L,
                        AttachmentKind.EVIDENCE, null,
                        "file", null,
                        7L, null, "Test User",
                        Instant.parse("2026-02-01T10:00:00Z")));

        mvc.perform(multipart("/api/projects/42/attachments").file(file).file(kind))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.originalFilename").value("prototype.png"));
    }

    @Test
    void uploadAttachment_browserStyleKindPart_returns201() throws Exception {
        // A browser's FormData.append("kind", "evidence") sends an untyped
        // part, which Spring reads as application/octet-stream. Binding the
        // part as AttachmentKind directly would 500 here before reaching the
        // controller body — so the part is taken as a String and parsed.
        MockMultipartFile file = new MockMultipartFile(
                "file", "demo.png", "image/png", "bytes".getBytes());
        MockMultipartFile kind = new MockMultipartFile(
                "kind", null, null, "evidence".getBytes());

        when(attachmentService.upload(eq(42L), any(), eq(AttachmentKind.EVIDENCE), isNull(), eq(CALLER_EMAIL)))
                .thenReturn(new ProjectAttachmentResponse(
                        100L, 42L, "demo.png", "image/png", 5L,
                        AttachmentKind.EVIDENCE, null,
                        "file", null,
                        7L, null, "Test User",
                        Instant.parse("2026-02-01T10:00:00Z")));

        mvc.perform(multipart("/api/projects/42/attachments").file(file).file(kind))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("file"));
    }

    @Test
    void uploadAttachment_unknownKind_returns400() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "demo.png", "image/png", "bytes".getBytes());
        MockMultipartFile kind = new MockMultipartFile(
                "kind", null, null, "not-a-kind".getBytes());

        mvc.perform(multipart("/api/projects/42/attachments").file(file).file(kind))
                .andExpect(status().isBadRequest());
        verify(attachmentService, never()).upload(anyLong(), any(), any(), any(), anyString());
    }

    @Test
    void uploadAttachment_oversized_returns422() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "huge.bin", "application/octet-stream", new byte[]{0x00});
        when(attachmentService.upload(eq(42L), any(), isNull(), isNull(), eq(CALLER_EMAIL)))
                .thenThrow(new LimitExceededException(
                        "File exceeds 10 MB limit (size: 11534336 bytes)"));

        mvc.perform(multipart("/api/projects/42/attachments").file(file))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message")
                        .value(org.hamcrest.Matchers.containsString("10 MB")));
    }

    @Test
    void uploadAttachment_sixthFile_returns422() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "sixth.pdf", "application/pdf", "pdf-bytes".getBytes());
        when(attachmentService.upload(eq(42L), any(), isNull(), isNull(), eq(CALLER_EMAIL)))
                .thenThrow(new LimitExceededException(
                        "Project already has the maximum 5 attachments"));

        mvc.perform(multipart("/api/projects/42/attachments").file(file))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message")
                        .value(org.hamcrest.Matchers.containsString("maximum 5")));
    }

    @Test
    void uploadAttachment_unverified_returns403() throws Exception {
        doThrow(new AccessDeniedException(
                        "Please verify your email before performing this action"))
                .when(writeGuard).requireVerified();

        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.pdf", "application/pdf", "pdf".getBytes());
        mvc.perform(multipart("/api/projects/42/attachments").file(file))
                .andExpect(status().isForbidden());
        verify(attachmentService, never()).upload(anyLong(), any(), any(), any(), anyString());
    }

    // ── Attachments: download ───────────────────────────────────────

    @Test
    void downloadAttachment_streamsBytes_withHeaders() throws Exception {
        byte[] payload = "fake-png-bytes".getBytes();
        when(attachmentService.download(eq(42L), eq(100L), eq(CALLER_EMAIL)))
                .thenReturn(new ProjectAttachmentService.DownloadedFile(
                        new ByteArrayInputStream(payload),
                        "prototype.png", "image/png", payload.length));

        mvc.perform(get("/api/projects/42/attachments/100"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "image/png"))
                .andExpect(header().longValue(HttpHeaders.CONTENT_LENGTH, payload.length))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString("filename=\"prototype.png\"")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString("filename*=UTF-8''")))
                .andExpect(content().bytes(payload));
    }

    @Test
    void downloadAttachment_notFound_returns404() throws Exception {
        when(attachmentService.download(eq(42L), eq(999L), eq(CALLER_EMAIL)))
                .thenThrow(new EntityNotFoundException("Attachment not found: 999"));

        mvc.perform(get("/api/projects/42/attachments/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void downloadAttachment_storageFailure_returns500() throws Exception {
        when(attachmentService.download(eq(42L), eq(100L), eq(CALLER_EMAIL)))
                .thenThrow(new StorageException("Disk read error"));

        mvc.perform(get("/api/projects/42/attachments/100"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void downloadAttachment_linkRow_returns400() throws Exception {
        // A link row has no bytes to stream — the service rejects it rather
        // than NPE'ing on a null storage path.
        when(attachmentService.download(eq(42L), eq(101L), eq(CALLER_EMAIL)))
                .thenThrow(new IllegalArgumentException(
                        "This attachment is a link, not a file. Open its linkUrl instead."));

        mvc.perform(get("/api/projects/42/attachments/101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value(org.hamcrest.Matchers.containsString("is a link")));
    }

    // ── Attachments: link evidence ──────────────────────────────────

    @Test
    void addLinkAttachment_valid_returns201() throws Exception {
        when(attachmentService.addLink(eq(42L), eq("https://youtu.be/demo"),
                isNull(), isNull(), eq(CALLER_EMAIL)))
                .thenReturn(new ProjectAttachmentResponse(
                        101L, 42L, "youtu.be", null, 0L,
                        AttachmentKind.EVIDENCE, null,
                        "link", "https://youtu.be/demo",
                        7L, null, "Test User",
                        Instant.parse("2026-02-01T10:00:00Z")));

        mvc.perform(post("/api/projects/42/attachments/link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"https://youtu.be/demo\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.LOCATION,
                        "/api/projects/42/attachments/101"))
                .andExpect(jsonPath("$.type").value("link"))
                .andExpect(jsonPath("$.linkUrl").value("https://youtu.be/demo"));
    }

    @Test
    void addLinkAttachment_badScheme_returns400() throws Exception {
        // Stored links are rendered as clickable anchors by the web client,
        // so non-http(s) schemes must never be persisted.
        when(attachmentService.addLink(eq(42L), eq("javascript:alert(1)"),
                isNull(), isNull(), eq(CALLER_EMAIL)))
                .thenThrow(new IllegalArgumentException(
                        "Evidence links must start with http:// or https://"));

        mvc.perform(post("/api/projects/42/attachments/link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"javascript:alert(1)\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value(org.hamcrest.Matchers.containsString("http://")));
    }

    @Test
    void addLinkAttachment_blankUrl_returns400() throws Exception {
        mvc.perform(post("/api/projects/42/attachments/link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"  \"}"))
                .andExpect(status().isBadRequest());
        verify(attachmentService, never()).addLink(anyLong(), anyString(), any(), any(), anyString());
    }

    @Test
    void addLinkAttachment_sixthAttachment_returns422() throws Exception {
        // Links share the 5-per-project cap with uploaded files.
        when(attachmentService.addLink(eq(42L), anyString(), isNull(), isNull(), eq(CALLER_EMAIL)))
                .thenThrow(new LimitExceededException(
                        "Project already has the maximum 5 attachments"));

        mvc.perform(post("/api/projects/42/attachments/link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"https://example.com/sixth\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message")
                        .value(org.hamcrest.Matchers.containsString("maximum 5")));
    }

    @Test
    void addLinkAttachment_unverified_returns403() throws Exception {
        doThrow(new AccessDeniedException(
                        "Please verify your email before performing this action"))
                .when(writeGuard).requireVerified();

        mvc.perform(post("/api/projects/42/attachments/link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"https://example.com/demo\"}"))
                .andExpect(status().isForbidden());
        verify(attachmentService, never()).addLink(anyLong(), anyString(), any(), any(), anyString());
    }

    // ── Attachments: delete ─────────────────────────────────────────

    @Test
    void deleteAttachment_returns204() throws Exception {
        mvc.perform(delete("/api/projects/42/attachments/100"))
                .andExpect(status().isNoContent());
        verify(attachmentService, times(1)).delete(eq(42L), eq(100L), eq(CALLER_EMAIL));
    }

    @Test
    void deleteAttachment_unverified_returns403() throws Exception {
        doThrow(new AccessDeniedException(
                        "Please verify your email before performing this action"))
                .when(writeGuard).requireVerified();

        mvc.perform(delete("/api/projects/42/attachments/100"))
                .andExpect(status().isForbidden());
        verify(attachmentService, never()).delete(anyLong(), anyLong(), anyString());
    }

    // ── Phase enum canonical labels (sanity-check the mobile vocabulary) ──

    @Test
    void allCanonicalPhases_serializeLowercase() {
        String[] expected = {"idea", "proposal", "prototype", "mvp", "scaling"};
        for (String label : expected) {
            ProjectPhase phase = ProjectPhase.valueOf(label.toUpperCase());
            org.junit.jupiter.api.Assertions.assertEquals(label, phase.json());
        }
    }
}
