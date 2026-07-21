package com.example.Innovation_backend.club;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

/**
 * An Innovation Club branch (a.k.a. Tawi). One per university in MVP,
 * but the schema allows multiple branches per university for future growth.
 *
 * Relationships:
 *   - {@code university} — required (FK)
 *   - {@code patron}     — optional, FK to {@link ClubLeader} (Mlezi role).
 *                          A club without a patron is valid (still pending setup).
 */
@Entity
@Table(name = "clubs",
        indexes = {
                @Index(name = "idx_club_university", columnList = "university_id"),
                @Index(name = "idx_club_status", columnList = "status")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "university_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_club_university"))
    private University university;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patron_id",
            foreignKey = @ForeignKey(name = "fk_club_patron"))
    private ClubLeader patron;

    @Column(length = 120)
    private String campus;

    @Column(length = 300)
    private String address;

    @Column(name = "founded_at")
    private LocalDate foundedAt;

    @Column(name = "charter_signed_at")
    private LocalDate charterSignedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ClubStatus status = ClubStatus.ACTIVE;

    /**
     * Cached member count. Updated by ClubMemberService when members register
     * or transition to active (rather than recomputing on every read).
     */
    @Column(name = "member_count", nullable = false)
    @Builder.Default
    private Integer memberCount = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}