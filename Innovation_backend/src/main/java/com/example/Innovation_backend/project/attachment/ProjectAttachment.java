package com.example.Innovation_backend.project.attachment;

import com.example.Innovation_backend.club.ClubMember;
import com.example.Innovation_backend.project.ProjectEntity;
import com.example.Innovation_backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Evidence (or other) attachment for a project. Evidence is either an
 * uploaded file — living under {@code {innovation.storage.root}/{storage_path}},
 * with this row carrying only metadata + a relative path string — or an
 * external {@code link_url} (Phase 7). Exactly one of the two is set.
 *
 * Exactly one of {@code uploadedByUser} / {@code uploadedByMember} is set,
 * matching the surface of the parent project. The CHECK constraint on
 * {@code project_attachments} (see V2__project_attachments.sql) enforces
 * the invariant.
 *
 * Cascade: deleting the parent project removes all rows via FK ON DELETE CASCADE,
 * then a cleanup pass reaps the orphaned files.
 */
@Entity
@Table(name = "project_attachments")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProjectAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_attachments_project"))
    private ProjectEntity project;

    /** Sanitised original filename shown to the user (in {@code Content-Disposition}). */
    @Column(name = "original_filename", nullable = false, length = 240)
    private String originalFilename;

    /**
     * Relative path under the storage root — what {@link StorageProvider} reads/writes.
     * Null for link attachments (see {@link #linkUrl}).
     */
    @Column(name = "storage_path", length = 512)
    private String storagePath;

    /**
     * External evidence URL (http/https only). Null for file attachments.
     * Exactly one of {@code storagePath} / {@code linkUrl} is set — enforced by
     * {@code chk_attachments_payload} (see V8__attachment_links.sql).
     */
    @Column(name = "link_url", length = 2048)
    private String linkUrl;

    @Column(name = "mime_type", length = 120)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttachmentKind kind;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_user_id",
            foreignKey = @ForeignKey(name = "fk_attachments_user"))
    private User uploadedByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_member_id",
            foreignKey = @ForeignKey(name = "fk_attachments_member"))
    private ClubMember uploadedByMember;

    @Column(length = 240)
    private String caption;

    @CreatedDate
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;
}
