package com.example.Innovation_backend.opportunity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
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

    /**
     * Phase 5 — bulk applicant count for owner-scoped lists.
     *
     * <p>Returns {@code [opportunityId, count]} pairs for every opportunity in
     * {@code opportunityIds}. Missing ids (e.g. a freshly created opportunity
     * with zero applications) are simply absent from the result map; the
     * service fills them with {@code 0L}.
     *
     * <p>Implemented as a JPQL projection so the count runs as one grouped
     * SQL query against the {@code applications} table, instead of N+1
     * per-opportunity lookups. Used by
     * {@link OpportunityService#listMine(String)}.
     */
    @Query("""
           SELECT a.opportunity.id, COUNT(a)
             FROM Application a
            WHERE a.opportunity.id IN :opportunityIds
            GROUP BY a.opportunity.id
           """)
    List<Object[]> countApplicationsByOpportunityIds(@Param("opportunityIds") Collection<Long> opportunityIds);
}