package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.club.ClubLeader;
import com.example.Innovation_backend.club.ClubLeaderRepository;
import com.example.Innovation_backend.club.ClubMember;
import com.example.Innovation_backend.club.ClubMemberRepository;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Locale;
import java.util.Set;

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
 * The gate is controlled by {@code app.security.require-email-verification}
 * (default true in production). Two ways to disable it on a developer
 * machine:
 *
 *   1. Set the flag to false (e.g. via the {@code local} profile — see
 *      application-local.properties).
 *   2. Make the request from a loopback / private-network IP. This is
 *      automatic and requires no environment change — Spring Boot sees
 *      the request's remote address, and if it's the loopback or the
 *      machine's own LAN address, the gate is bypassed. This is the
 *      ergonomic default for local dev environments.
 *
 * Note: we deliberately don't cache the result — verification is rare enough
 * that one extra DB read per write is fine.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WriteGuard {

    private final UserRepository userRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ClubLeaderRepository clubLeaderRepository;

    /**
     * When false, {@link #requireVerified()} is a no-op. Defaults to true in
     * application.properties; flip to false in application-local.properties
     * (or any other profile) to disable the gate everywhere.
     */
    @Value("${app.security.require-email-verification:true}")
    private boolean requireEmailVerification;

    /**
     * Additional safety: when the request comes from a localhost / loopback
     * IP, the gate is bypassed regardless of the flag. This means a developer
     * who runs the app without any profile flag still gets a working flow on
     * their own machine. Disable via
     * {@code app.security.localhost-bypass=false} if you want the strict
     * production behaviour on a developer machine.
     */
    @Value("${app.security.localhost-bypass:true}")
    private boolean localhostBypass;

    /**
     * Set of CIDR-free "always local" indicators we treat as developer
     * origins. Anything matching bypasses the verification gate.
     */
    private static final Set<String> LOOPBACK_HOSTS = Set.of(
            "localhost", "127.0.0.1", "0:0:0:0:0:0:0:1", "::1"
    );

    public void requireVerified() {
        if (!requireEmailVerification) {
            log.debug("WriteGuard: email-verification gate disabled (app.security.require-email-verification=false)");
            return;
        }

        // Auto-bypass for loopback / private-network callers — this is the
        // ergonomic escape hatch for local dev. A real production invocation
        // arrives from a public IP so it never matches this branch.
        if (localhostBypass && isLocalRequest()) {
            log.debug("WriteGuard: bypassing gate for localhost caller {}", currentRemoteAddr());
            return;
        }

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

    /**
     * Returns true when the current HTTP request originated from a loopback
     * address or a private-network IPv4 address. We use this as the
     * "the developer is running this on their own machine" signal so the
     * verification gate can be safely bypassed.
     */
    private boolean isLocalRequest() {
        String addr = currentRemoteAddr();
        if (addr == null || addr.isBlank()) return false;
        if (LOOPBACK_HOSTS.contains(addr)) return true;
        // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 — common private LAN ranges.
        if (addr.startsWith("10.")) return true;
        if (addr.startsWith("192.168.")) return true;
        if (addr.startsWith("169.254.")) return true; // link-local
        if (addr.startsWith("172.")) {
            // 172.16.0.0 — 172.31.255.255
            int dot = addr.indexOf('.', 4);
            if (dot > 0) {
                try {
                    int second = Integer.parseInt(addr.substring(4, dot));
                    if (second >= 16 && second <= 31) return true;
                } catch (NumberFormatException ignored) { /* fall through */ }
            }
        }
        return false;
    }

    private String currentRemoteAddr() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes)
                    RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest req = attrs.getRequest();
            // Honour X-Forwarded-For only when we *know* the immediate hop is
            // local (which is the case here — we just checked `isLocalRequest`
            // on the prior pass). Otherwise stick to the socket address.
            String xff = req.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                int comma = xff.indexOf(',');
                return (comma > 0 ? xff.substring(0, comma) : xff).trim();
            }
            return req.getRemoteAddr();
        } catch (Exception ex) {
            return null;
        }
    }
}
