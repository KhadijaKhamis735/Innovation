package com.example.Innovation_backend.opportunity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {

    /** Funder's own list, newest first. */
    List<Opportunity> findAllByFunderIdOrderByCreatedAtDesc(Long funderId);

    /** Public feed: all OPEN opportunities, newest first. */
    List<Opportunity> findAllByStatusOrderByCreatedAtDesc(OpportunityStatus status);

    /** Public feed filtered by both status and type. */
    List<Opportunity> findAllByStatusAndTypeOrderByCreatedAtDesc(OpportunityStatus status, OpportunityType type);

    /**
     * Admin queue: everything regardless of status, newest first. Implemented as
     * an explicit @Query so the method name stays simple; we may add filters later.
     */
    @Query("SELECT o FROM Opportunity o ORDER BY o.createdAt DESC")
    List<Opportunity> findAllForAdmin();

    /**
     * Admin queue: filtered by status (used for ?status=open, ?status=closed, etc.).
     */
    @Query("SELECT o FROM Opportunity o WHERE o.status = :status ORDER BY o.createdAt DESC")
    List<Opportunity> findAllForAdminByStatus(@Param("status") OpportunityStatus status);
}