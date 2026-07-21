package com.example.Innovation_backend.club;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubRepository extends JpaRepository<Club, Long> {

    /** Public listing — only ACTIVE branches show up. */
    List<Club> findAllByStatusOrderByNameAsc(ClubStatus status);

    /** Admin / debug use — every branch regardless of status. */
    List<Club> findAllByOrderByNameAsc();
}