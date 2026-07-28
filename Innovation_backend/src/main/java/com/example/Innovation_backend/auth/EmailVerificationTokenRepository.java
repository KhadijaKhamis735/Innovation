package com.example.Innovation_backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    /** All tokens for a principal — used to invalidate old tokens on re-issue. */
    List<EmailVerificationToken> findAllBySurfaceAndUserId(
            EmailVerificationToken.Surface surface, Long userId);
}
