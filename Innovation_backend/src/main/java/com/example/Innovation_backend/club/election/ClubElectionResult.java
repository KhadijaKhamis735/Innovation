package com.example.Innovation_backend.club.election;

import com.example.Innovation_backend.club.ClubLeader;
import com.example.Innovation_backend.club.ClubMember;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Snapshot of the tally for one closed election. One row per election;
 * written once at tally time. {@code countsJson} stores the per-candidate
 * vote map {@code Map<Long, Integer>} serialized as JSON; this is the only
 * place per-candidate counts are exposed (the ballots table never returns
 * via a GET, only aggregates do).
 */
@Entity
@Table(name = "club_election_results",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_result_election",
                                  columnNames = {"election_id"})
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubElectionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "election_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_result_election"))
    private ClubElection election;

    @Column(name = "total_ballots", nullable = false)
    @Builder.Default
    private Integer totalBallots = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id",
            foreignKey = @ForeignKey(name = "fk_result_winner"))
    private ClubMember winner;

    @Column(name = "winner_votes", nullable = false)
    @Builder.Default
    private Integer winnerVotes = 0;

    @Column(name = "spoiled_ballots", nullable = false)
    @Builder.Default
    private Integer spoiledBallots = 0;

    /**
     * JSON-encoded map of candidateId → vote count. Length 8KB is plenty for
     * the 7-position case (each candidateId is up to 19 digits + comma).
     * If a branch ever runs an election with hundreds of write-ins this
     * needs to grow, but per IBARA YA 19 there are exactly 7 positions.
     */
    @Lob
    @Column(name = "counts_json", nullable = false, columnDefinition = "text")
    private String countsJson;

    @Column(name = "closed_at", nullable = false)
    private Instant closedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by",
            foreignKey = @ForeignKey(name = "fk_result_closed_by"))
    private ClubLeader closedBy;
}
