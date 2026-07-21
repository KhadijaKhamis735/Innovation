package com.example.Innovation_backend.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    /** All applications for an opportunity, newest first. Used by the funder
     *  "ReceivedApplications" view. */
    List<Application> findAllByOpportunityIdOrderByAppliedAtDesc(Long opportunityId);

    /** All applications submitted by an innovator, newest first. Used by the
     *  "My Applications" view on the innovator dashboard. */
    List<Application> findAllByInnovatorIdOrderByAppliedAtDesc(Long innovatorId);

    /** Used by ApplicationService.create to enforce the unique constraint
     *  before the DB rejects the insert (and gives a cleaner 409). */
    Optional<Application> findByOpportunityIdAndInnovatorId(Long opportunityId, Long innovatorId);
}