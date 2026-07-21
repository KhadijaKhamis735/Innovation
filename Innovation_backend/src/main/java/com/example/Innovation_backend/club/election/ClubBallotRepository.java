package com.example.Innovation_backend.club.election;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClubBallotRepository extends JpaRepository<ClubBallot, Long> {

    /**
     * One-vote-per-voter check; the DB also has a unique constraint on
     * (election_id, voter_id) but we check here for a clean 409 vs a DB error.
     */
    boolean existsByElectionIdAndVoterId(Long electionId, Long voterId);

    long countByElectionId(Long electionId);

    /** Per-candidate aggregate — the ONLY way the service computes counts. */
    long countByElectionIdAndCandidateId(Long electionId, Long candidateId);

    /**
     * Deliberately NOT exposed: no findAll* method exists for ballots. The
     * secret-ballot guarantee holds at the repository boundary.
     */
}
