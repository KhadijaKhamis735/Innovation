package com.example.Innovation_backend.club.election;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClubElectionResultRepository extends JpaRepository<ClubElectionResult, Long> {

    /** At most one row per election (enforced by unique constraint). */
    Optional<ClubElectionResult> findByElectionId(Long electionId);
}
