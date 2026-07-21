package com.example.Innovation_backend.club;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubProjectRepository extends JpaRepository<ClubProject, Long> {

    /** A member's own projects, newest first. */
    List<ClubProject> findAllByAuthorIdOrderByCreatedAtDesc(Long authorId);

    /** Public branch feed — all projects for a branch, newest first. */
    List<ClubProject> findAllByClubIdOrderByCreatedAtDesc(Long clubId);
}
