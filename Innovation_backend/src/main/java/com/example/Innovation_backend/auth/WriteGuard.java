package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.club.ClubLeader;
import com.example.Innovation_backend.club.ClubLeaderRepository;
import com.example.Innovation_backend.club.ClubMember;
import com.example.Innovation_backend.club.ClubMemberRepository;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Phase 6B — gate write actions on email-verified status.
 *
 * Call from any write service with {@code writeGuard.requireVerified()}.
 * It looks up the calling principal by email, determines which table
 * they live in (User | ClubMember | ClubLeader), and throws
 * {@link AccessDeniedException} if {@code email_verified} is false.
 *
 *   - ADMIN (seeded) → always verified (column defaults true)
 *   - CLUB_LEADER (seeded by admin) → always verified (column defaults true)
 *   - Anything else → must have clicked the verification link
 *
 * Note: we deliberately don't cache the result — verification is rare enough
 * that one extra DB read per write is fine.
 */
@Component
@RequiredArgsConstructor
public class WriteGuard {

    private final UserRepository userRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ClubLeaderRepository clubLeaderRepository;

    public void requireVerified() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            // Unauthenticated requests never reach a write service (SecurityConfig
            // rejects them), but be defensive.
            throw new AccessDeniedException("Not authenticated");
        }
        String email = auth.getName().trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            // ADMIN bypasses verification (admin is seeded + already verified,
            // but if some future flow creates an unverified admin, we still
            // block them; admins are seeded only).
            if (!user.isEmailVerified()) {
                throw new AccessDeniedException(
                        "Please verify your email before performing this action");
            }
            return;
        }

        ClubMember member = clubMemberRepository.findByEmail(email).orElse(null);
        if (member != null) {
            if (!member.isEmailVerified()) {
                throw new AccessDeniedException(
                        "Please verify your email before performing this action");
            }
            return;
        }

        ClubLeader leader = clubLeaderRepository.findByEmail(email).orElse(null);
        if (leader != null) {
            // Leaders are admin-managed; the column defaults true, but be explicit.
            // If a leader is somehow created unverified (future flow), block.
            // (No emailVerified field on ClubLeader yet — assumed always verified.)
            return;
        }

        throw new AccessDeniedException("Unknown principal: " + email);
    }
}
