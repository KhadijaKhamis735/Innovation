package com.example.Innovation_backend.club;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClubLeaderRepository extends JpaRepository<ClubLeader, Long> {

    Optional<ClubLeader> findByEmail(String email);

    boolean existsByEmail(String email);
}