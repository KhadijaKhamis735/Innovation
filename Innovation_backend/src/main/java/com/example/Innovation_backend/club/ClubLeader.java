package com.example.Innovation_backend.club;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * A leader (Mlezi or KamatiTendaji) of an Innovation Club. Seeded by
 * DataSeedRunner so the auth/login flow can be tested without manual signup.
 *
 * Leaders are NOT branch-scoped in MVP — a single leader can be patron of
 * multiple clubs. Branch ownership for the PATCH /api/club/members/{id}/status
 * endpoint is enforced at the service layer by checking that the acting leader
 * and the target member share a club.
 */
@Entity
@Table(name = "club_leaders",
        uniqueConstraints = @UniqueConstraint(name = "uk_club_leader_email", columnNames = "email"),
        indexes = {
                @Index(name = "idx_leader_university", columnList = "university_id")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubLeader {

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
            foreignKey = @ForeignKey(name = "fk_leader_university"))
    private University university;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClubLeaderRole role;

    @Column(length = 32)
    private String phone;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "active"; // active | inactive

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}