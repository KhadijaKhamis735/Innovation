package com.example.Innovation_backend.project;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {

    /**
     * All projects owned by either the given user-id (INNOVATION) or member-id
     * (CLUB). The single id might match both rare cases; result is the union.
     */
    @Query("""
           SELECT p FROM ProjectEntity p
            WHERE p.ownerUser.id   = :ownerId
               OR p.ownerMember.id = :ownerId
            ORDER BY p.createdAt DESC
           """)
    List<ProjectEntity> findAllByOwnerIdOrderByCreatedAtDesc(@Param("ownerId") Long ownerId);

    /** Used by the controller's owner-check before mutating an INNOVATION project. */
    @Query("""
           SELECT p FROM ProjectEntity p
            WHERE p.id = :id AND p.ownerUser.id = :ownerId
           """)
    Optional<ProjectEntity> findByIdAndOwnerUserId(@Param("id") Long id,
                                                   @Param("ownerId") Long ownerId);

    @Query("""
           SELECT p FROM ProjectEntity p
            WHERE p.id = :id AND p.ownerMember.id = :ownerId
           """)
    Optional<ProjectEntity> findByIdAndOwnerMemberId(@Param("id") Long id,
                                                     @Param("ownerId") Long ownerId);

    /** Admin queue: INNOVATION projects awaiting review. */
    @Query("""
           SELECT p FROM ProjectEntity p
            WHERE p.surface = com.example.Innovation_backend.project.ProjectSurface.INNOVATION
              AND p.approvalStatus = :status
            ORDER BY p.createdAt ASC
           """)
    List<ProjectEntity> findAllInnovationByApprovalStatus(@Param("status") ProjectApprovalStatus status);

    /** Public feed for a single branch — gated by service-layer same-uni check. */
    List<ProjectEntity> findAllByClubIdOrderByCreatedAtDesc(Long clubId);

    /** Pessimistic lock for the upload path (Phase 5C-B) to serialise the 5-attachments cap. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ProjectEntity p WHERE p.id = :id")
    Optional<ProjectEntity> findByIdForUpdate(@Param("id") Long id);

    /**
     * Counts APPROVED innovation projects whose zsaId starts with the given year
     * prefix, e.g. {@code "ZSA-INV-2026-"} → drives the auto-generated sequence.
     */
    @Query("""
           SELECT COUNT(p) FROM ProjectEntity p
            WHERE p.surface = com.example.Innovation_backend.project.ProjectSurface.INNOVATION
              AND p.zsaId LIKE CONCAT(:prefix, '%')
           """)
    long countByZsaIdStartingWith(@Param("prefix") String prefix);

    @Query("""
           SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
             FROM ProjectEntity p
            WHERE p.zsaId = :zsaId
           """)
    boolean existsByZsaId(@Param("zsaId") String zsaId);
}
