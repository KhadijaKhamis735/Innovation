package com.example.Innovation_backend.organization;

import com.example.Innovation_backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * A funder's organization. Auto-created as PENDING on funder registration;
 * admin must approve before the funder can POST opportunities.
 *
 * One row per funder (User with role=FUNDER). The owning funder's id is in
 * {@code funderId}; we use it for owner-checks.
 */
@Entity
@Table(name = "organizations",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_org_funder", columnNames = "funder_id")
        },
        indexes = {
                @Index(name = "idx_org_status", columnList = "status")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Owning funder (User with role=FUNDER). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "funder_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_org_funder"))
    private User funder;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, length = 160)
    private String email;

    @Column(length = 160)
    private String location;

    @Column(length = 80)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrganizationStatus status = OrganizationStatus.PENDING;

    @CreatedDate
    @Column(name = "submitted_date", nullable = false, updatable = false)
    private Instant submittedDate;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}