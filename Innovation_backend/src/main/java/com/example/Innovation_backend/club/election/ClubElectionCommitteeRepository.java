package com.example.Innovation_backend.club.election;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubElectionCommitteeRepository extends JpaRepository<ClubElectionCommittee, Long> {

    /** The currently active committee for a branch. */
    Optional<ClubElectionCommittee> findFirstByClubIdAndActiveTrue(Long clubId);

    List<ClubElectionCommittee> findAllByClubIdOrderByFormedAtDesc(Long clubId);

    /**
     * Bulk-flip prior active committees inactive before inserting a new one.
     * Run inside {@code ClubElectionService.formCommittee}'s
     * {@code SERIALIZABLE} transaction.
     */
    @Modifying
    @Query("update ClubElectionCommittee c set c.active = false " +
           "where c.club.id = :clubId and c.active = true")
    int deactivateActiveByClubId(@Param("clubId") Long clubId);
}
