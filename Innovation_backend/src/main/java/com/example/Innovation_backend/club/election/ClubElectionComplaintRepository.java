package com.example.Innovation_backend.club.election;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubElectionComplaintRepository extends JpaRepository<ClubElectionComplaint, Long> {

    /** Returns all complaints (resolved + unresolved) so the caller can filter. */
    List<ClubElectionComplaint> findAllByElectionIdOrderByFiledAtDesc(Long electionId);
}
