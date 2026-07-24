package com.example.Innovation_backend.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    /**
     * Used by the controller's owner-check before mutating a milestone.
     * Joins through to either {@code ownerUser} (INNOVATION) or {@code ownerMember}
     * (CLUB) — both polymorphic authors — so the same check works for both surfaces.
     */
    @Query("""
           SELECT m FROM Milestone m
            WHERE m.id = :milestoneId
              AND (
                   (m.project.ownerUser.id   = :ownerId)
                OR (m.project.ownerMember.id = :ownerId)
              )
           """)
    Optional<Milestone> findByIdAndProjectOwnerId(@Param("milestoneId") Long milestoneId,
                                                 @Param("ownerId") Long ownerId);
}
