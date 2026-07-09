package com.example.Innovation_backend.project;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

/**
 * A single milestone belonging to an {@link InnovatorProject}. Stored in its
 * own table (per Phase 3A decision) so the user can add custom milestones
 * and the backend can query/report on completion rates.
 */
@Entity
@Table(name = "project_milestones",
        indexes = {
                @Index(name = "idx_milestone_project", columnList = "project_id")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Milestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_milestone_project"))
    private InnovatorProject project;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private boolean completed;

    /** Set when {@link #completed} flips to true. Null otherwise. */
    @Column
    private LocalDate completedDate;

    /** Display order within the project (lower = earlier). */
    @Column(nullable = false)
    private int position;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;
}