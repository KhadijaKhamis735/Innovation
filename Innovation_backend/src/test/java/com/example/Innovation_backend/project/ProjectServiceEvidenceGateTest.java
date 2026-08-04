package com.example.Innovation_backend.project;

import com.example.Innovation_backend.club.ClubAccessChecks;
import com.example.Innovation_backend.club.ClubRepository;
import com.example.Innovation_backend.project.attachment.AttachmentKind;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentRepository;
import com.example.Innovation_backend.project.attachment.StorageProvider;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Service-level coverage for the evidence gate on
 * {@link ProjectService#updatePhase}.
 *
 * The controller slice mocks {@code ProjectService}, so the counting logic
 * itself is only reachable here. Contract:
 *   - PROTOTYPE / MVP with zero EVIDENCE attachments → IllegalArgumentException (400)
 *   - PROTOTYPE / MVP with at least one → saved
 *   - IDEA / PROPOSAL / SCALING → never consult the attachment repo
 */
@ExtendWith(MockitoExtension.class)
class ProjectServiceEvidenceGateTest {

    private static final String EMAIL = "innovator@example.com";
    private static final Long PROJECT_ID = 42L;

    @Mock private ProjectRepository projectRepo;
    @Mock private UserRepository userRepo;
    @Mock private ClubRepository clubRepo;
    @Mock private ClubAccessChecks clubAccessChecks;
    @Mock private ProjectAttachmentRepository attachmentRepo;
    @Mock private StorageProvider storage;

    @InjectMocks private ProjectService projectService;

    private ProjectEntity project;

    @BeforeEach
    void setUp() {
        User owner = User.builder()
                .id(7L)
                .email(EMAIL)
                .role(Role.INNOVATOR)
                .build();

        project = ProjectEntity.builder()
                .id(PROJECT_ID)
                .name("Solar Cold Storage")
                .surface(ProjectSurface.INNOVATION)
                .phase(ProjectPhase.IDEA)
                .ownerUser(owner)
                .build();

        when(projectRepo.findById(PROJECT_ID)).thenReturn(Optional.of(project));
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
    }

    @Test
    void updatePhase_toPrototype_withoutEvidence_throws() {
        when(attachmentRepo.countByProjectIdAndKind(PROJECT_ID, AttachmentKind.EVIDENCE))
                .thenReturn(0L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> projectService.updatePhase(PROJECT_ID, ProjectPhase.PROTOTYPE, EMAIL));

        org.junit.jupiter.api.Assertions.assertTrue(
                ex.getMessage().contains("Evidence is required"), ex.getMessage());
        org.junit.jupiter.api.Assertions.assertTrue(
                ex.getMessage().contains("prototype"), ex.getMessage());
        // The phase must not have been mutated on the entity either.
        assertEquals(ProjectPhase.IDEA, project.getPhase());
        verify(projectRepo, never()).save(any());
    }

    @Test
    void updatePhase_toMvp_withoutEvidence_throws() {
        when(attachmentRepo.countByProjectIdAndKind(PROJECT_ID, AttachmentKind.EVIDENCE))
                .thenReturn(0L);

        assertThrows(IllegalArgumentException.class,
                () -> projectService.updatePhase(PROJECT_ID, ProjectPhase.MVP, EMAIL));
        verify(projectRepo, never()).save(any());
    }

    @Test
    void updatePhase_toPrototype_withEvidence_saves() {
        when(attachmentRepo.countByProjectIdAndKind(PROJECT_ID, AttachmentKind.EVIDENCE))
                .thenReturn(1L);
        when(projectRepo.save(any(ProjectEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        projectService.updatePhase(PROJECT_ID, ProjectPhase.PROTOTYPE, EMAIL);

        assertEquals(ProjectPhase.PROTOTYPE, project.getPhase());
        verify(projectRepo).save(project);
    }

    @Test
    void updatePhase_toOptionalStage_skipsEvidenceCheck() {
        when(projectRepo.save(any(ProjectEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        for (ProjectPhase phase : new ProjectPhase[]{
                ProjectPhase.IDEA, ProjectPhase.PROPOSAL, ProjectPhase.SCALING}) {
            projectService.updatePhase(PROJECT_ID, phase, EMAIL);
            assertEquals(phase, project.getPhase());
        }

        // Never even queried — optional stages don't pay for the count.
        verify(attachmentRepo, never()).countByProjectIdAndKind(any(), eq(AttachmentKind.EVIDENCE));
    }
}
