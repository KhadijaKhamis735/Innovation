package com.example.Innovation_backend.project.dto;

import com.example.Innovation_backend.project.ProjectEntity;
import com.example.Innovation_backend.project.ProjectPhase;
import com.example.Innovation_backend.project.ProjectSurface;
import com.example.Innovation_backend.project.attachment.AttachmentKind;
import com.example.Innovation_backend.project.attachment.ProjectAttachment;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentRepository;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * DTO-level coverage for the {@code evidence} field added to {@link ProjectResponse}.
 *
 * The Admin moderation queue reads {@link ProjectResponse}, so without this
 * field admins have no way to see what an Innovator uploaded as evidence at a
 * PROTOTYPE / MVP transition. These tests pin the contract:
 *
 *   - EVIDENCE-kind attachments surface, ordered oldest-first.
 *   - OTHER-kind attachments are hidden (admin moderation queue only cares
 *     about the evidence gate).
 *   - Null repository ⇒ empty list (write-path overload).
 *   - Project with no attachments ⇒ empty list.
 */
@ExtendWith(MockitoExtension.class)
class ProjectResponseEvidenceTest {

    @Mock private ProjectAttachmentRepository attachmentRepo;

    private ProjectEntity newProject(Long id) {
        User owner = User.builder()
                .id(7L)
                .email("innovator@example.com")
                .firstName("Test")
                .lastName("User")
                .role(Role.INNOVATOR)
                .build();
        return ProjectEntity.builder()
                .id(id)
                .surface(ProjectSurface.INNOVATION)
                .ownerUser(owner)
                .name("Solar Cold Storage")
                .phase(ProjectPhase.PROTOTYPE)
                .tags(new ArrayList<>())
                .milestones(new ArrayList<>())
                .build();
    }

    private ProjectAttachment attachment(Long id, Long projectId, AttachmentKind kind,
                                          Instant uploadedAt, String originalFilename,
                                          String linkUrl) {
        ProjectEntity p = ProjectEntity.builder().id(projectId).build();
        return ProjectAttachment.builder()
                .id(id)
                .project(p)
                .kind(kind)
                .originalFilename(originalFilename)
                .linkUrl(linkUrl)
                .storagePath(linkUrl == null ? "/uploads/" + originalFilename : null)
                .mimeType(linkUrl == null ? "application/pdf" : null)
                .sizeBytes(linkUrl == null ? 12_345L : 0L)
                .uploadedAt(uploadedAt)
                .build();
    }

    @Test
    void withRepo_returnsEvidenceOldestFirst_andExcludesOtherKind() {
        ProjectEntity p = newProject(42L);

        // Three EVIDENCE rows out of order + one OTHER row that must be hidden.
        ProjectAttachment otherKind = attachment(99L, 42L,
                AttachmentKind.OTHER, Instant.parse("2026-08-04T10:00:00Z"),
                "logo.png", null);
        ProjectAttachment evFile = attachment(11L, 42L,
                AttachmentKind.EVIDENCE, Instant.parse("2026-08-02T09:00:00Z"),
                "spec.pdf", null);
        ProjectAttachment evLinkOld = attachment(12L, 42L,
                AttachmentKind.EVIDENCE, Instant.parse("2026-07-30T08:00:00Z"),
                "github.com", "https://github.com/me/repo");
        ProjectAttachment evLinkNew = attachment(13L, 42L,
                AttachmentKind.EVIDENCE, Instant.parse("2026-08-04T12:00:00Z"),
                "youtube.com", "https://www.youtube.com/watch?v=demo");

        when(attachmentRepo.findAllByProjectIdOrderByUploadedAtDesc(42L))
                .thenReturn(List.of(evFile, evLinkNew, evLinkOld, otherKind));

        ProjectResponse out = ProjectResponse.fromEntity(p, attachmentRepo);

        assertEquals(3, out.evidence().size(), "OTHER-kind row must be hidden");
        // Oldest first — the link row uploaded on 2026-07-30 comes before the
        // 2026-08-02 file, which comes before the 2026-08-04 link.
        assertEquals(12L, out.evidence().get(0).id());
        assertEquals(11L, out.evidence().get(1).id());
        assertEquals(13L, out.evidence().get(2).id());
        // Type is derived server-side — link rows render as "link".
        assertEquals("link", out.evidence().get(0).type());
        assertEquals("file", out.evidence().get(1).type());
        assertEquals("link", out.evidence().get(2).type());
    }

    @Test
    void withRepo_noAttachments_returnsEmptyList() {
        ProjectEntity p = newProject(42L);
        when(attachmentRepo.findAllByProjectIdOrderByUploadedAtDesc(42L))
                .thenReturn(List.of());

        ProjectResponse out = ProjectResponse.fromEntity(p, attachmentRepo);

        assertTrue(out.evidence().isEmpty());
    }

    @Test
    void withRepo_nullProjectId_returnsEmptyList() {
        // Edge case — DTO is built from a transient entity (no id yet). The
        // write path doesn't load evidence anyway, but the guard prevents an
        // NPE if someone wires it accidentally.
        ProjectEntity p = newProject(null);

        ProjectResponse out = ProjectResponse.fromEntity(p, attachmentRepo);

        assertTrue(out.evidence().isEmpty());
    }

    @Test
    void writeOverload_neverCallsRepository_andReturnsEmptyEvidence() {
        ProjectEntity p = newProject(42L);

        ProjectResponse out = ProjectResponse.fromEntity(p);

        assertTrue(out.evidence().isEmpty());
        verify(attachmentRepo, never()).findAllByProjectIdOrderByUploadedAtDesc(42L);
        // Single-arg overload has no repo at all — sanity check it doesn't
        // accidentally try to call methods on a null reference.
        lenient().when(attachmentRepo.findAllByProjectIdOrderByUploadedAtDesc(42L))
                .thenReturn(List.of()); // would never be invoked
    }
}
