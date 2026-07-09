package com.example.Innovation_backend.project;

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
 * An innovation project owned by an innovator (User with role=INNOVATOR).
 * Has a 1:N relationship with {@link Milestone}. Cascade delete ensures
 * milestones are removed when the project is deleted.
 */
@Entity
@Table(name = "innovator_projects",
        indexes = {
                @Index(name = "idx_project_owner", columnList = "owner_id"),
                @Index(name = "idx_project_phase", columnList = "phase")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InnovatorProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_project_owner"))
    private User owner;

    /** Optional external/registry id assigned by admin on approval (e.g. "ZSA-INV-2026-001"). */
    @Column(length = 64, unique = true)
    private String zsaId;

    /** PENDING → APPROVED | REJECTED. Set by admin via /api/admin/projects/{id}/approve|reject. */
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    @Builder.Default
    private ProjectApprovalStatus approvalStatus = ProjectApprovalStatus.PENDING;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 120)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectPhase phase;

    @Column(length = 2000)
    private String description;

    /** Date the project was kicked off. Display-only. */
    @Column
    private LocalDate startDate;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("position ASC, id ASC")
    @Builder.Default
    private List<Milestone> milestones = new ArrayList<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    /** Helper to add a milestone and keep both sides of the relationship in sync. */
    public void addMilestone(Milestone m) {
        m.setProject(this);
        this.milestones.add(m);
    }
}
