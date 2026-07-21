package com.example.Innovation_backend.club.election;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubExecutiveRepository extends JpaRepository<ClubExecutive, Long> {

    /** The current holder of one position at one branch (null = vacant). */
    Optional<ClubExecutive> findByClubIdAndPosition(Long clubId, ExecutivePosition position);

    /** Full committee rowset for a branch — 0..7 entries (one per held position). */
    List<ClubExecutive> findAllByClubIdOrderByPositionAsc(Long clubId);

    /**
     * Hard delete by (clubId, position). Used by removeExecutive.
     * Distinct from soft-delete-by-clearing-memberId; see service docs.
     */
    @Modifying
    @Query("delete from ClubExecutive e where e.club.id = :clubId and e.position = :position")
    int deleteByClubIdAndPosition(@Param("clubId") Long clubId,
                                  @Param("position") ExecutivePosition position);
}
