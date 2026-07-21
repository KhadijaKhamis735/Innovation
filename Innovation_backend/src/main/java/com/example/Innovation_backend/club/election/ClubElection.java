package com.example.Innovation_backend.club.election;

import com.example.Innovation_backend.club.Club;
import com.example.Innovation_backend.club.ClubLeader;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * An election for one Executive Committee position at one branch.
 *
 * State machine: see {@link ClubElectionStatus#canTransitionTo}.
 *
 * The {@code nominationsEndAt} / {@code campaignEndAt} / {@code votingEndAt}
 * triple is set at announcement time and editable later via /reopen (which
 * only updates {@code votingEndAt}). The cache field {@code nominationsCount}
 * is updated when nominations are added/removed — the authoritative count
 * still comes from {@link ClubNominationRepository}.
 */
@Entity
@Table(name = "club_elections",
        indexes = {
                @Index(name = "idx_election_club", columnList = "club_id"),
                @Index(name = "idx_election_status", columnList = "status"),
                @Index(name = "idx_election_club_position_status",
                       columnList = "club_id, position, status")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubElection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_election_club"))
    private Club club;

    /** Election committee that oversees this election (nullable for legacy data). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "committee_id",
            foreignKey = @ForeignKey(name = "fk_election_committee"))
    private ClubElectionCommittee committee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ExecutivePosition position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    @Builder.Default
    private ClubElectionStatus status = ClubElectionStatus.NOMINATIONS_OPEN;

    @Column(name = "nominations_end_at", nullable = false)
    private Instant nominationsEndAt;

    @Column(name = "campaign_end_at", nullable = false)
    private Instant campaignEndAt;

    @Column(name = "voting_end_at", nullable = false)
    private Instant votingEndAt;

    /** Cache of nomination count; updated in service on add/remove. */
    @Column(name = "nominations_count", nullable = false)
    @Builder.Default
    private Integer nominationsCount = 0;

    @Column(name = "closed_at")
    private Instant closedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "announced_by",
            foreignKey = @ForeignKey(name = "fk_election_announced_by"))
    private ClubLeader announcedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by",
            foreignKey = @ForeignKey(name = "fk_election_closed_by"))
    private ClubLeader closedBy;

    @CreatedDate
    @Column(name = "opened_at", nullable = false, updatable = false)
    private Instant openedAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
