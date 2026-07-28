package com.example.Innovation_backend.club.activity;

import com.example.Innovation_backend.club.ClubMember;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Signup row — a {@link ClubMember} opting into a {@link ClubActivity}.
 *
 * Unique constraint on (activity_id, member_id) prevents double-signup.
 * The row is deleted when the activity is deleted (FK cascade).
 */
@Entity
@Table(name = "club_activity_registrations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_activity_member", columnNames = {"activity_id", "member_id"}),
        indexes = {
                @Index(name = "idx_reg_activity", columnList = "activity_id"),
                @Index(name = "idx_reg_member", columnList = "member_id")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubActivityRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "activity_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_reg_activity"))
    private ClubActivity activity;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_reg_member"))
    private ClubMember member;

    @CreatedDate
    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt;
}