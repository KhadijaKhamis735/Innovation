package com.example.Innovation_backend.club;

import com.example.Innovation_backend.club.dto.ClubAuthResponse;
import com.example.Innovation_backend.club.dto.ClubCreateRequest;
import com.example.Innovation_backend.club.dto.ClubLeaderCreateRequest;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

/**
 * Admin-only mutations on the club surface.
 *
 *   POST /api/admin/club-leaders   (admin)   create a ClubLeader
 *   POST /api/admin/clubs          (admin)   create a Club branch
 *
 * These are the operations the admin uses to set up the club surface
 * before any self-registration can succeed. Leaders and branches
 * are NOT seeded — admins create them on demand.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Transactional   // keep Hibernate session open while we map LAZY relations into DTOs
public class ClubAdminController {

    private final ClubLeaderRepository leaderRepo;
    private final UniversityRepository universityRepo;
    private final ClubRepository clubRepo;
    private final PasswordEncoder passwordEncoder;

    /**
     * Create a new ClubLeader. Used during onboarding to put a trusted
     * person in charge of a branch. The leader can then log in via
     * POST /api/club/auth/login and approve/suspend members.
     */
    @PostMapping("/club-leaders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClubAuthResponse.LeaderView> createLeader(
            @Valid @RequestBody ClubLeaderCreateRequest req) {

        if (leaderRepo.existsByEmail(req.email().trim().toLowerCase())) {
            throw new ClubAuthService.DuplicatePrincipalException(
                    "A club leader with that email already exists");
        }
        University uni = universityRepo.findById(req.universityId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "University not found: " + req.universityId()));

        ClubLeader leader = ClubLeader.builder()
                .email(req.email().trim().toLowerCase())
                .password(passwordEncoder.encode(req.password()))
                .fullName(req.fullName().trim())
                .university(uni)
                .role(req.role())
                .phone(req.phone())
                .status("active")
                .build();
        ClubLeader saved = leaderRepo.save(leader);
        return ResponseEntity
                .created(URI.create("/api/admin/club-leaders/" + saved.getId()))
                .body(ClubAuthResponse.LeaderView.from(saved));
    }

    /**
     * Create a new Club branch. Members can only register into a branch
     * that exists for their university — so this must be called before
     * self-registration succeeds for that university.
     */
    @PostMapping("/clubs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.example.Innovation_backend.club.dto.BranchResponse> createClub(
            @Valid @RequestBody ClubCreateRequest req) {

        University uni = universityRepo.findById(req.universityId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "University not found: " + req.universityId()));

        ClubLeader patron = null;
        if (req.patronId() != null) {
            patron = leaderRepo.findById(req.patronId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Patron leader not found: " + req.patronId()));
            if (!patron.getUniversity().getId().equals(uni.getId())) {
                throw new IllegalArgumentException(
                        "Patron must belong to the same university as the club");
            }
        }

        Club club = Club.builder()
                .name(req.name().trim())
                .university(uni)
                .patron(patron)
                .campus(req.campus())
                .address(req.address())
                .foundedAt(req.foundedAt())
                .charterSignedAt(req.charterSignedAt())
                .status(ClubStatus.ACTIVE)
                .memberCount(0)
                .build();
        Club saved = clubRepo.save(club);
        return ResponseEntity
                .created(URI.create("/api/club/branches/" + saved.getId()))
                .body(com.example.Innovation_backend.club.dto.BranchResponse.from(saved));
    }
}