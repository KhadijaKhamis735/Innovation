package com.example.Innovation_backend.club.activity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubActivityRepository extends JpaRepository<ClubActivity, Long> {

    /** All activities for a branch, ordered by start time. */
    List<ClubActivity> findAllByClubIdOrderByStartAtAsc(Long clubId);

    /** Activities for a branch filtered by status (used for "upcoming" / "cancelled" views). */
    List<ClubActivity> findAllByClubIdAndStatusOrderByStartAtAsc(Long clubId, ClubActivityStatus status);
}