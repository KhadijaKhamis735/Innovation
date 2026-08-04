package com.example.Innovation_backend.application;

import com.example.Innovation_backend.opportunity.Opportunity;
import com.example.Innovation_backend.project.ProjectEntity;
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

    /**
     * Phase 9 — the tracked project this application is about, when the
     * innovator applied with an existing APPROVED project rather than
     * pitching a brand-new idea. NULL for "new idea" applications.
     *
     * <p>Nullable by design: the new-idea path is still the default and must
     * keep working. When set, the funder's detail view resolves the project's
     * ZSA ID, current phase and evidence live from the project row rather
     * than from the snapshot columns below — so a stage update the innovator
     * makes after submitting is visible to the funder immediately.
     *
     * <p>The DB-side FK is {@code ON DELETE SET NULL} (see V9): deleting a
     * project must not delete the funder's application record. The snapshot
     * columns ({@link #ideaTitle}, {@link #problemStatement},
     * {@link #proposedSolution}) are always written even for linked
     * applications precisely so the row still reads sensibly if the link is
     * later severed.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id",
            foreignKey = @ForeignKey(name = "fk_app_project"))
    private ProjectEntity project;

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

    /**
     * Phase 8 — dynamic application form fields. The funder's opportunity
     * picks which set is used (see {@link com.example.Innovation_backend.opportunity.ApplicationFormType}).
     * All fields are optional; the ApplicationRequest validation enforces
     * presence only on the form-type-relevant ones. We keep the legacy
     * 4-column innovation fields NOT NULL so existing rows migrate cleanly.
     */

    /** INNOVATION_APPLICATION only — "Idea" / "Prototype" / "MVP". */
    @Column(name = "current_stage", length = 32)
    private String currentStage;

    /**
     * Optional supporting documents. Free text — URLs, filenames, or notes.
     * Used by both forms (innovation's "Supporting Documents"; profile's
     * "CV / Portfolio" link).
     */
    @Column(name = "supporting_documents", columnDefinition = "TEXT")
    private String supportingDocuments;

    /** PROFILE_APPLICATION only — university / institution name. */
    @Column(length = 200)
    private String university;

    /** PROFILE_APPLICATION only — year of study or course label. */
    @Column(name = "year_of_study", length = 50)
    private String yearOfStudy;

    /** PROFILE_APPLICATION only — applicant city / region. */
    @Column(name = "applicant_location", length = 200)
    private String applicantLocation;

    /** PROFILE_APPLICATION only — "Why do you want this opportunity?" */
    @Column(columnDefinition = "TEXT")
    private String motivation;

    /** PROFILE_APPLICATION only — "What do you hope to gain?" */
    @Column(name = "hopes_to_gain", columnDefinition = "TEXT")
    private String hopesToGain;

    /**
     * PROFILE_APPLICATION only — applicant's full name (denormalised so the
     * Received Applications view keeps the original even if the user
     * updates their profile later).
     */
    @Column(name = "full_name", length = 200)
    private String fullName;

    /**
     * PROFILE_APPLICATION only — applicant email at the time of submission.
     * Same denormalisation rationale as {@link #fullName}.
     */
    @Column(length = 200)
    private String email;

    /**
     * PROFILE_APPLICATION only — URL or filename for the CV / Portfolio.
     * Stored as TEXT for flexibility (full URL, Drive link, or a filename
     * if the platform later adds file uploads).
     */
    @Column(name = "cv_link", columnDefinition = "TEXT")
    private String cvLink;

    /**
     * Phase 9 — "Why this opportunity fits", the one free-text field an
     * existing-project application still asks the innovator for. NULL on
     * new-idea applications, where the problem/solution fields already carry
     * the narrative.
     */
    @Column(name = "pitch_note", columnDefinition = "TEXT")
    private String pitchNote;

    @CreatedDate
    @Column(name = "applied_at", nullable = false, updatable = false)
    private Instant appliedAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}