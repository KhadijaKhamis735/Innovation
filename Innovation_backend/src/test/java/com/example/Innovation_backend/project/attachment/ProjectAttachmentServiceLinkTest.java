package com.example.Innovation_backend.project.attachment;

import com.example.Innovation_backend.club.ClubAccessChecks;
import com.example.Innovation_backend.project.ProjectEntity;
import com.example.Innovation_backend.project.ProjectPhase;
import com.example.Innovation_backend.project.ProjectRepository;
import com.example.Innovation_backend.project.ProjectSurface;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Service-level coverage for link evidence
 * ({@link ProjectAttachmentService#addLink}).
 *
 * The URL rules are a security boundary, not formatting polish: stored links
 * are rendered as clickable anchors by the web client, so {@code javascript:}
 * and {@code data:} payloads must be rejected before they reach the DB. The
 * controller slice mocks this service, so those rules are only reachable here.
 */
@ExtendWith(MockitoExtension.class)
class ProjectAttachmentServiceLinkTest {

    private static final String EMAIL = "innovator@example.com";
    private static final Long PROJECT_ID = 42L;

    @Mock private ProjectRepository projectRepo;
    @Mock private ProjectAttachmentRepository attachmentRepo;
    @Mock private StorageProvider storage;
    @Mock private LocalFilesystemStorageProvider localStorage;
    @Mock private UserRepository userRepo;
    @Mock private ClubAccessChecks clubAccessChecks;

    @InjectMocks private ProjectAttachmentService service;

    private User owner;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(7L)
                .email(EMAIL)
                .firstName("Test")
                .lastName("User")
                .role(Role.INNOVATOR)
                .build();

        ProjectEntity project = ProjectEntity.builder()
                .id(PROJECT_ID)
                .name("Solar Cold Storage")
                .surface(ProjectSurface.INNOVATION)
                .phase(ProjectPhase.IDEA)
                .ownerUser(owner)
                .build();

        // Rejected-URL tests bail out before touching these.
        lenient().when(projectRepo.findByIdForUpdate(PROJECT_ID)).thenReturn(Optional.of(project));
        lenient().when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        lenient().when(attachmentRepo.countByProjectId(PROJECT_ID)).thenReturn(0L);
        lenient().when(attachmentRepo.save(any(ProjectAttachment.class)))
                .thenAnswer(inv -> {
                    ProjectAttachment a = inv.getArgument(0);
                    a.setId(101L);
                    a.setUploadedAt(java.time.Instant.parse("2026-02-01T10:00:00Z"));
                    return a;
                });
    }

    @Test
    void addLink_https_storesLinkRowWithNoFile() throws Exception {
        ProjectAttachmentResponse res = service.addLink(
                PROJECT_ID, "https://www.youtube.com/watch?v=demo", null, "Demo video", EMAIL);

        assertEquals("link", res.type());
        assertEquals("https://www.youtube.com/watch?v=demo", res.linkUrl());
        assertEquals(AttachmentKind.EVIDENCE, res.kind());
        assertEquals(0L, res.sizeBytes());
        assertNull(res.mimeType());
        // original_filename is NOT NULL and drives the list UI — links borrow
        // it for a host label with the www. prefix stripped.
        assertEquals("youtube.com", res.originalFilename());
        assertEquals("Demo video", res.caption());

        verify(storage, never()).store(any(), any(), org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    void addLink_trimsSurroundingWhitespace() {
        // Guards the Postman/Thunder-Client trailing-newline class of bug.
        ProjectAttachmentResponse res = service.addLink(
                PROJECT_ID, "  https://example.com/demo\n", null, null, EMAIL);

        assertEquals("https://example.com/demo", res.linkUrl());
    }

    @Test
    void addLink_javascriptScheme_rejected() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.addLink(PROJECT_ID, "javascript:alert(1)", null, null, EMAIL));
        org.junit.jupiter.api.Assertions.assertTrue(
                ex.getMessage().contains("http://"), ex.getMessage());
        verify(attachmentRepo, never()).save(any());
    }

    @Test
    void addLink_dataScheme_rejected() {
        assertThrows(IllegalArgumentException.class,
                () -> service.addLink(PROJECT_ID, "data:text/html;base64,PHNjcmlwdD4=",
                        null, null, EMAIL));
        verify(attachmentRepo, never()).save(any());
    }

    @Test
    void addLink_relativeUrl_rejected() {
        assertThrows(IllegalArgumentException.class,
                () -> service.addLink(PROJECT_ID, "/uploads/evidence.pdf", null, null, EMAIL));
        verify(attachmentRepo, never()).save(any());
    }

    @Test
    void addLink_blank_rejected() {
        assertThrows(IllegalArgumentException.class,
                () -> service.addLink(PROJECT_ID, "   ", null, null, EMAIL));
        assertThrows(IllegalArgumentException.class,
                () -> service.addLink(PROJECT_ID, null, null, null, EMAIL));
        verify(attachmentRepo, never()).save(any());
    }

    @Test
    void addLink_atCap_rejected() {
        // Links and files share one 5-per-project budget.
        when(attachmentRepo.countByProjectId(PROJECT_ID)).thenReturn(5L);

        LimitExceededException ex = assertThrows(LimitExceededException.class,
                () -> service.addLink(PROJECT_ID, "https://example.com/sixth", null, null, EMAIL));
        org.junit.jupiter.api.Assertions.assertTrue(
                ex.getMessage().contains("maximum 5"), ex.getMessage());
        verify(attachmentRepo, never()).save(any());
    }
}
