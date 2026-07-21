package com.example.Innovation_backend.club;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * A registered member of an Innovation Club branch.
 *
 * Category-specific fields are validated at the service layer based on
 * {@link #category} — only the relevant subset should be populated, but
 * all four are nullable columns so we don't need separate tables per category.
 *
 *   STUDENT    → regNumber       (e.g. "SUZA/2024/001")
 *   STAFF      → staffId
 *   ALUMNI     → graduationYear  (e.g. 2020)
 *   CORPORATE  → organizationName, organizationRole
 *
 * Self-registered (no admin gate) but starts at status=PENDING. A leader
 * (or admin) must approve via PATCH /api/club/members/{id}/status to flip
 * to ACTIVE.
 */
@Entity
@Table(name = "club_members",
        uniqueConstraints = @UniqueConstraint(name = "uk_club_member_email", columnNames = "email"),
        indexes = {
                @Index(name = "idx_member_club", columnList = "club_id"),
                @Index(name = "idx_member_status", columnList = "status"),
                @Index(name = "idx_member_university", columnList = "university_id")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String email;

    /** BCrypt hash. Never exposed via API. */
    @Column(nullable = false, length = 100)
    private String password;

    @Column(name = "full_name", nullable = false, length = 160)
    private String fullName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "university_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_member_university"))
    private University university;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MemberCategory category;

    // Category-specific fields — see class doc.
    @Column(name = "reg_number", length = 64)
    private String regNumber;

    @Column(name = "staff_id", length = 64)
    private String staffId;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(name = "organization_name", length = 200)
    private String organizationName;

    @Column(name = "organization_role", length = 120)
    private String organizationRole;

    @Column(length = 500)
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MembershipStatus status = MembershipStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by",
            foreignKey = @ForeignKey(name = "fk_member_verified_by"))
    private ClubLeader verifiedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_member_club"))
    private Club club;

    @CreatedDate
    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}