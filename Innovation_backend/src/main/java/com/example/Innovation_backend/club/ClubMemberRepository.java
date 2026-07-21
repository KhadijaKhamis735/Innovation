package com.example.Innovation_backend.club;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {

    Optional<ClubMember> findByEmail(String email);

    boolean existsByEmail(String email);

    /** Directory listing for a branch. Status filter is applied at the service layer. */
    List<ClubMember> findAllByClubIdOrderByFullNameAsc(Long clubId);
}