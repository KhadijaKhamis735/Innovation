package com.example.Innovation_backend.club.election;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClubElectionRepository extends JpaRepository<ClubElection, Long> {

    /** All elections for one branch, most recently opened first. */
    List<ClubElection> findAllByClubIdOrderByOpenedAtDesc(Long clubId);

    /** Branch-scoped fetch — privacy-safe cross-branch lookup returns empty. */
    Optional<ClubElection> findByIdAndClubId(Long id, Long clubId);

    /** Active election for a position (e.g. "is there a NOMINATIONS_OPEN election for chair?"). */
    Optional<ClubElection> findByClubIdAndPositionAndStatusIn(
            Long clubId, ExecutivePosition position, Collection<ClubElectionStatus> statuses);
}
