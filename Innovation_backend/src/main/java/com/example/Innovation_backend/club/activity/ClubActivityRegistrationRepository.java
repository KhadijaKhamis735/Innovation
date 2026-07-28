package com.example.Innovation_backend.club.activity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubActivityRegistrationRepository
        extends JpaRepository<ClubActivityRegistration, Long> {

    List<ClubActivityRegistration> findAllByActivityId(Long activityId);

    Optional<ClubActivityRegistration> findByActivityIdAndMemberId(Long activityId, Long memberId);

    boolean existsByActivityIdAndMemberId(Long activityId, Long memberId);

    long countByActivityId(Long activityId);

    long deleteByActivityIdAndMemberId(Long activityId, Long memberId);
}