package com.example.Innovation_backend.club.announcement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubAnnouncementRepository extends JpaRepository<ClubAnnouncement, Long> {

    /**
     * Feed for a branch. Pinned items first (so the "Term opens Friday" notice
     * stays on top), then newest first.
     */
    List<ClubAnnouncement> findAllByClubIdOrderByPinnedDescCreatedAtDesc(Long clubId);
}