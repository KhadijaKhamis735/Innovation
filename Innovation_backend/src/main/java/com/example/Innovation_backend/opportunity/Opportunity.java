package com.example.Innovation_backend.opportunity;

import com.example.Innovation_backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

/**
 * An opportunity (grant / accelerator / challenge / etc.) posted by a funder.
 *
 * Phase 3B: a funder can only POST one of these if their organization is APPROVED
 * — enforced in {@link OpportunityService}. Public reads filter by status = OPEN.
 *
 * Owned by a single {@link User} with role=FUNDER. The FK is on {@code funder_id}.
 */
@Entity
@Table(name = "opportunities",
        indexes = {
                @Index(name = "idx_opportunity_funder", columnList = "funder_id"),
                @Index(name = "idx_opportunity_status", columnList = "status"),
                @Index(name = "idx_opportunity_type",   columnList = "type")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Opportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Owning funder (User with role=FUNDER). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "funder_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_opportunity_funder"))
    private User funder;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OpportunityType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OpportunityStatus status = OpportunityStatus.OPEN;

    /** Free-text amount (e.g. "$10,000", "KES 500,000"). Not numeric — display only. */
    @Column(length = 100)
    private String amount;

    /** Optional deadline. When set and in the past, the frontend marks the opp as CLOSED. */
    @Column
    private LocalDate deadline;

    @Column(length = 160)
    private String location;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}