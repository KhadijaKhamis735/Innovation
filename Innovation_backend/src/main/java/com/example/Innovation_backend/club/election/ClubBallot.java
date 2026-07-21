package com.example.Innovation_backend.club.election;

import com.example.Innovation_backend.club.ClubMember;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * One voter's choice in one election. Secret-ballot at the API layer: this
 * row is never returned by a GET endpoint; aggregate counts come from
 * {@code ClubBallotRepository.countByElectionIdAndCandidateId}.
 *
 * The {@code (election_id, voter_id)} unique constraint enforces
 * "one vote per voter per election" at the DB level — duplicates throw
 * {@code DataIntegrityViolationException} which the service catches and
 * translates to a 409.
 *
 * {@code candidateId} is denormalized (also reachable via the candidate's
 * nominations on this election) so count queries don't need a join.
 */
@Entity
@Table(name = "club_ballots",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_ballot_election_voter",
                                  columnNames = {"election_id", "voter_id"})
        },
        indexes = {
                @Index(name = "idx_ballot_election_candidate",
                       columnList = "election_id, candidate_id"),
                @Index(name = "idx_ballot_election",
                       columnList = "election_id")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubBallot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "election_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ballot_election"))
    private ClubElection election;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "voter_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ballot_voter"))
    private ClubMember voter;

    /** Denormalized so count queries need no join. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ballot_candidate"))
    private ClubMember candidate;

    @CreatedDate
    @Column(name = "cast_at", nullable = false, updatable = false)
    private Instant castAt;
}
