package com.example.Innovation_backend.project;

import com.example.Innovation_backend.club.Club;
import com.example.Innovation_backend.club.ClubMember;
import com.example.Innovation_backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Unified project entity (Phase 5C-A).
 *
 * Replaces the two parallel tables:
 *   - {@code innovator_projects} (owned by {@code User})
 *   - {@code club_projects}     (owned by {@code ClubMember}, scoped to a Club)
 *
 * One polymorphic-author row per project. The cluster of nullable FKs
 * ({@code ownerUserId}, {@code ownerMemberId}, {@code clubId}) is enforced
 * by a Postgres CHECK constraint defined in Flyway V1; one of two patterns
 * must hold:
 *
 *   surface = INNOVATION → ownerUserId NOT NULL, the other two NULL
 *   surface = CLUB       → ownerMemberId NOT NULL, clubId NOT NULL, ownerUserId NULL
 *
 * ZSA-approval fields ({@code zsaId}, {@code approvalStatus}) are populated
 * only for INNOVATION rows. The CHECK constraint enforces that.
 *
 * Milestones live in their own table {@link Milestone} (one-to-many).
 */
@Entity
@Table(name = "projects",
        indexes = {
                @Index(name = "idx_projects_phase", columnList = "phase"),
                @Index(name = "idx_projects_surface", columnList = "surface")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectSurface surface;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 240)
    private String tagline;

    @Column(length = 2000)
    private String description;

    @Column(length = 120)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectPhase phase;

    /** OPTIONAL tags — used for club projects; null/empty for innovation. */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "project_tags",
            joinColumns = @JoinColumn(name = "project_id",
                    foreignKey = @ForeignKey(name = "fk_project_tag_project")))
    @Column(name = "tag", length = 60)
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    /** Date the project was kicked off. Display-only. */
    @Column(name = "start_date")
    private LocalDate startDate;

    // ── Innovation surface only ──────────────────────────────────────

    /** External registry id assigned by admin on approval (e.g. "ZSA-INV-2026-001"). */
    @Column(name = "zsa_id", length = 64, unique = true)
    private String zsaId;

    /** PENDING → APPROVED | REJECTED. Set by admin via /api/admin/projects/{id}/approve|reject. */
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20)
    private ProjectApprovalStatus approvalStatus;

    // ── Polymorphic author (exactly one is NOT NULL) ─────────────────

    /** Innovation surface: the innovator who owns this project. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id",
            foreignKey = @ForeignKey(name = "fk_projects_owner_user"))
    private User ownerUser;

    /** Club surface: the club member who posted this project. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_member_id",
            foreignKey = @ForeignKey(name = "fk_projects_owner_member"))
    private ClubMember ownerMember;

    /** Club surface: the branch the project belongs to (derived from the author's club). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id",
            foreignKey = @ForeignKey(name = "fk_projects_club"))
    private Club club;

    // ── Milestones ───────────────────────────────────────────────────

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("position ASC, id ASC")
    @Builder.Default
    private List<Milestone> milestones = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Helper to add a milestone and keep both sides in sync. */
    public void addMilestone(Milestone m) {
        m.setProject(this);
        this.milestones.add(m);
    }
}
