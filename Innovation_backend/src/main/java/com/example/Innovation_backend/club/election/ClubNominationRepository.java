package com.example.Innovation_backend.club.election;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubNominationRepository extends JpaRepository<ClubNomination, Long> {

    List<ClubNomination> findAllByElectionIdOrderByNominatedAtAsc(Long electionId);

    /** Service-level duplicate guard before the unique-constraint violation. */
    boolean existsByElectionIdAndCandidateId(Long electionId, Long candidateId);

    Optional<ClubNomination> findByElectionIdAndCandidateId(Long electionId, Long candidateId);
}
