package com.example.Innovation_backend.project.attachment;

import com.example.Innovation_backend.club.ClubAccessChecks;
import com.example.Innovation_backend.club.MembershipStatus;
import com.example.Innovation_backend.project.ProjectEntity;
import com.example.Innovation_backend.project.ProjectRepository;
import com.example.Innovation_backend.project.ProjectSurface;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.NoSuchFileException;
import java.util.List;

/**
 * Evidence upload / list / download / delete for unified projects.
 *
 * Authz model (all four operations):
 *   - ADMIN                → always allowed.
 *   - Project owner        → the {@code User} (INNOVATION) or {@code ClubMember}
 *                            (CLUB) who originally created the project.
 *   - Leader of same branch → CLUB surface only — a {@code ClubLeader} whose
 *                            club_id matches the project's club_id.
 *   - Anyone else          → 404 (privacy — never 403).
 *
 * CLUB-surface uploaders must be ACTIVE — PENDING members cannot post on
 * behalf of the branch, even though they can browse.
 *
 * The 5-attachments-per-project cap is enforced under a Postgres pessimistic
 * lock so concurrent uploads can't both squeak past the limit.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectAttachmentService {

    private static final long MAX_BYTES = 10L * 1024 * 1024;       // 10 MB
    private static final int  MAX_PER_PROJECT = 5;

    private final ProjectRepository projectRepo;
    private final ProjectAttachmentRepository attachmentRepo;
    private final StorageProvider storage;
    private final LocalFilesystemStorageProvider localStorage;
    private final UserRepository userRepo;
    private final ClubAccessChecks clubAccessChecks;

    // ── Upload ───────────────────────────────────────────────────────

    @Transactional
    public ProjectAttachmentResponse upload(Long projectId,
                                            MultipartFile file,
                                            AttachmentKind kind,
                                            String caption,
                                            String callerEmail) {
        if (file == null || file.isEmpty()) {
            throw new LimitExceededException("File is required and must not be empty");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new LimitExceededException(
                    "File exceeds the " + (MAX_BYTES / 1024 / 1024) + " MB limit");
        }

        // Lock the project row to serialise concurrent uploads against the 5-cap.
        ProjectEntity p = projectRepo.findByIdForUpdate(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        enforceWriteAccess(p, callerEmail);

        // Re-check count under lock — race-free now.
        long existing = attachmentRepo.countByProjectId(projectId);
        if (existing >= MAX_PER_PROJECT) {
            throw new LimitExceededException(
                    "Project already has the maximum " + MAX_PER_PROJECT + " attachments");
        }

        // Build paths + write to _pending/, then commit on the JPA flush.
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String pendingPath = localStorage.buildPendingPath(projectId, originalName);
        String finalPath = pendingPath.replace("/_pending/", "/");

        // Trust the actual bytes written (returned by storage.store) over the
        // multipart's advertised size — a partial / truncated upload would
        // otherwise be reported as full-size in the DB row.
        long actualBytes;
        try (InputStream in = file.getInputStream()) {
            StorageProvider.StoredObject stored = storage.store(pendingPath, in, file.getSize());
            actualBytes = stored.sizeBytes();
            localStorage.commit(pendingPath, finalPath);
        } catch (IOException ioe) {
            // Roll back the staging file; transaction rolls back the (not-yet-inserted) row.
            try { storage.delete(pendingPath); } catch (IOException ignored) {}
            throw new StorageException("Failed to store uploaded file", ioe);
        }

        ProjectAttachment a = ProjectAttachment.builder()
                .project(p)
                .originalFilename(safeFilename(originalName))
                .storagePath(finalPath)
                .mimeType(file.getContentType())
                .sizeBytes(actualBytes)
                .kind(kind != null ? kind : AttachmentKind.EVIDENCE)
                .caption(caption != null && !caption.isBlank() ? caption.trim() : null)
                .uploadedByUser(p.getSurface() == ProjectSurface.INNOVATION ? resolveInnovator(callerEmail) : null)
                .uploadedByMember(p.getSurface() == ProjectSurface.CLUB ? resolveActiveMember(callerEmail) : null)
                .build();

        return ProjectAttachmentResponse.fromEntity(attachmentRepo.save(a));
    }

    // ── List ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProjectAttachmentResponse> list(Long projectId, String callerEmail) {
        ProjectEntity p = projectRepo.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
        enforceReadAccess(p, callerEmail);
        return attachmentRepo.findAllByProjectIdOrderByUploadedAtDesc(projectId).stream()
                .map(ProjectAttachmentResponse::fromEntity)
                .toList();
    }

    // ── Download ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DownloadedFile download(Long projectId, Long attachmentId, String callerEmail) {
        ProjectEntity p = projectRepo.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
        enforceReadAccess(p, callerEmail);

        ProjectAttachment a = attachmentRepo.findByIdAndProjectId(attachmentId, projectId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment not found: " + attachmentId));

        InputStream stream;
        try {
            stream = storage.read(a.getStoragePath());
        } catch (NoSuchFileException nsfe) {
            log.warn("Attachment row {} references missing file {} — treating as 410",
                    attachmentId, a.getStoragePath());
            throw new GoneException("Attachment file is no longer available");
        } catch (IOException ioe) {
            throw new StorageException("Failed to read attachment", ioe);
        }

        return new DownloadedFile(stream, a.getOriginalFilename(), a.getMimeType(), a.getSizeBytes());
    }

    // ── Delete ───────────────────────────────────────────────────────

    @Transactional
    public void delete(Long projectId, Long attachmentId, String callerEmail) {
        ProjectEntity p = projectRepo.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
        // Deletes are stricter than reads — only the owner or an admin.
        enforceOwnerOrAdmin(p, callerEmail);

        ProjectAttachment a = attachmentRepo.findByIdAndProjectId(attachmentId, projectId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment not found: " + attachmentId));

        attachmentRepo.delete(a);
        attachmentRepo.flush(); // ensure FK is gone before we unlink the file

        try {
            storage.delete(a.getStoragePath());
        } catch (IOException ioe) {
            // Orphan file is acceptable; broken row reference is not.
            log.warn("Attachment row {} deleted but file {} could not be removed: {}",
                    attachmentId, a.getStoragePath(), ioe.getMessage());
        }
    }

    // ── Authz helpers ────────────────────────────────────────────────

    private void enforceReadAccess(ProjectEntity p, String email) {
        if (p.getSurface() == ProjectSurface.INNOVATION) {
            // INNOVATION projects are public to any authenticated caller.
            // (Privacy is already handled by controller-level @PreAuthorize.)
            return;
        }
        // CLUB projects: same-university gate. Cross-uni reads return 404.
        clubAccessChecks.requireSameUniversityOrAdmin(p.getClub());
    }

    private void enforceWriteAccess(ProjectEntity p, String email) {
        if (p.getSurface() == ProjectSurface.INNOVATION) {
            User u = userRepo.findByEmail(email.trim().toLowerCase())
                    .orElseThrow(() -> new EntityNotFoundException("Project not found: " + p.getId()));
            if (!isAdmin(email) && (p.getOwnerUser() == null
                    || !p.getOwnerUser().getId().equals(u.getId()))) {
                throw new EntityNotFoundException("Project not found: " + p.getId());
            }
            return;
        }
        // CLUB: admin, owner, or leader of same university. Leaders are
        // university-scoped (not branch-scoped) per the ClubLeader entity doc.
        clubAccessChecks.requireLeaderOfSameUniversityOrOwnerOrAdmin(
                p.getOwnerMember() == null ? null : p.getOwnerMember().getId(),
                p.getClub() == null || p.getClub().getUniversity() == null
                        ? null : p.getClub().getUniversity().getId());
    }

    private void enforceOwnerOrAdmin(ProjectEntity p, String email) {
        if (isAdmin(email)) return;
        if (p.getSurface() == ProjectSurface.INNOVATION) {
            User u = userRepo.findByEmail(email.trim().toLowerCase())
                    .orElseThrow(() -> new EntityNotFoundException("Project not found: " + p.getId()));
            if (p.getOwnerUser() == null || !p.getOwnerUser().getId().equals(u.getId())) {
                throw new EntityNotFoundException("Project not found: " + p.getId());
            }
            return;
        }
        if (p.getOwnerMember() == null) {
            throw new EntityNotFoundException("Project not found: " + p.getId());
        }
        // Owner only on delete — leader doesn't get delete rights on CLUB rows.
        String normalized = email.trim().toLowerCase();
        if (!normalized.equals(p.getOwnerMember().getEmail().trim().toLowerCase())) {
            throw new EntityNotFoundException("Project not found: " + p.getId());
        }
    }

    private User resolveInnovator(String email) {
        return userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new AccessDeniedException("Innovator not found for caller"));
    }

    private com.example.Innovation_backend.club.ClubMember resolveActiveMember(String email) {
        var me = clubAccessChecks.currentMemberOpt()
                .orElseThrow(() -> new AccessDeniedException("Club member not found for caller"));
        if (me.getStatus() != MembershipStatus.ACTIVE) {
            throw new AccessDeniedException(
                    "Only active club members can upload evidence. Your status is "
                            + me.getStatus().json() + ".");
        }
        return me;
    }

    private boolean isAdmin(String email) {
        return userRepo.findByEmail(email.trim().toLowerCase())
                .map(u -> u.getRole() == com.example.Innovation_backend.user.Role.ADMIN)
                .orElse(false);
    }

    private static String safeFilename(String name) {
        if (name == null) return "file";
        String cleaned = name.replaceAll("[\\\\/\\u0000-\\u001F\\u007F]", "_").trim();
        if (cleaned.isEmpty()) return "file";
        if (cleaned.length() > 240) cleaned = cleaned.substring(cleaned.length() - 240);
        return cleaned;
    }

    // ── Value types ──────────────────────────────────────────────────

    /** Streamed back by the controller — caller must close the input stream. */
    public record DownloadedFile(InputStream stream, String filename, String mimeType, long sizeBytes) {}

    /** Maps to 410 Gone — the row exists but the file is gone (e.g. cleanup pass). */
    public static class GoneException extends RuntimeException {
        public GoneException(String message) { super(message); }
    }
}
