package com.example.Innovation_backend.club.election;

import com.example.Innovation_backend.club.Club;
import com.example.Innovation_backend.club.ClubMember;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * The current executive committee member for one (branch, position). One row
 * per position per branch, replaced (not appended) when a new executive is
 * installed or appointed.
 *
 *   position: {@link ExecutivePosition}
 *   source:   ELECTION | APPOINTMENT | BY_ELECTION
 *   reelectedCount: 0..2 (IBARA YA 33 max consecutive terms)
 *
 * The unique constraint {@code uk_executive_club_position(club_id, position)}
 * guarantees the "one holder per position" invariant.
 *
 * {@code memberId} is nullable when the seat is vacant — the service's
 * {@code removeExecutive} keeps the row but nulls the member, OR deletes the
 * row entirely. We delete in 5B for simplicity; the DELETE endpoint returns
 * 204. See {@code ClubExecutiveService.removeExecutive} for the chosen
 * behavior.
 */
@Entity
@Table(name = "club_executives",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_executive_club_position",
                                  columnNames = {"club_id", "position"})
        },
        indexes = {
                @Index(name = "idx_executive_club", columnList = "club_id")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubExecutive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_executive_club"))
    private Club club;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ExecutivePosition position;

    /** Nullable when the seat is vacant (use seat to model the gap, not a deleted row). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id",
            foreignKey = @ForeignKey(name = "fk_executive_member"))
    private ClubMember member;

    @Column(name = "elected_at", nullable = false)
    private Instant electedAt;

    @Column(name = "term_ends_at", nullable = false)
    private Instant termEndsAt;

    @Column(name = "is_interim", nullable = false)
    @Builder.Default
    private Boolean isInterim = false;

    @Column(name = "reelected_count", nullable = false)
    @Builder.Default
    private Integer reelectedCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ExecutiveSource source;

    /** Election that installed this executive; null for pure APPOINTMENT. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "installed_by_election_id",
            foreignKey = @ForeignKey(name = "fk_executive_installed_election"))
    private ClubElection installedByElection;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
