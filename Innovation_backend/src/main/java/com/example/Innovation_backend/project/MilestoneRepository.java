package com.example.Innovation_backend.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    /** Used by the controller's owner-check before mutating a milestone. */
    Optional<Milestone> findByIdAndProjectOwnerId(Long milestoneId, Long ownerId);
}