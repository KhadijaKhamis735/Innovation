package com.example.Innovation_backend.application;

import com.example.Innovation_backend.opportunity.Opportunity;
import com.example.Innovation_backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * An innovator's application to a funder opportunity. Belongs to a single
 * {@link User} (the applicant, role=INNOVATOR) and one {@link Opportunity}.
 *
 * Phase 3C business rules:
 *   - An innovator can apply once per opportunity (unique constraint below).
 *   - Stage defaults to SUBMITTED on create; funder (opportunity owner) or
 *     admin may move it to any other stage via PATCH.
 *   - Hard delete only on admin moderation; soft-delete isn't needed yet.
 */
@Entity
@Table(name = "applications",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_app_opportunity_innovator",
                        columnNames = {"opportunity_id", "innovator_id"})
        },
        indexes = {
                @Index(name = "idx_app_opportunity", columnList = "opportunity_id"),
                @Index(name = "idx_app_innovator", columnList = "innovator_id"),
                @Index(name = "idx_app_stage", columnList = "stage")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The opportunity being applied to. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "opportunity_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_app_opportunity"))
    private Opportunity opportunity;

    /** The innovator (User with role=INNOVATOR) who submitted this application. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "innovator_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_app_innovator"))
    private User innovator;

    @Column(nullable = false, length = 200)
    private String ideaTitle;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String problemStatement;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String proposedSolution;

    /** Optional. Stored as BigDecimal so totals can be aggregated later. */
    @Column(precision = 14, scale = 2)
    private BigDecimal estimatedBudget;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ApplicationStage stage = ApplicationStage.SUBMITTED;

    @CreatedDate
    @Column(name = "applied_at", nullable = false, updatable = false)
    private Instant appliedAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}