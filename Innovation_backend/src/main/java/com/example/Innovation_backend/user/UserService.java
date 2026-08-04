package com.example.Innovation_backend.user;

import com.example.Innovation_backend.user.dto.RegisterRequest;
import com.example.Innovation_backend.user.dto.UpdateProfileRequest;
import com.example.Innovation_backend.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();

        if (repo.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        Role role = req.role();
        if (role == Role.ADMIN) {
            // Admin accounts are seeded only, never self-registered
            throw new IllegalArgumentException("Cannot self-register as admin");
        }
        if (role == Role.FUNDER && (req.sector() == null || req.sector().isBlank())) {
            throw new IllegalArgumentException("sector is required for funder registration");
        }

        User u = User.builder()
                .email(email)
                .password(passwordEncoder.encode(req.password()))
                .firstName(req.firstName().trim())
                .lastName(req.lastName().trim())
                .role(role)
                .sector(req.sector())
                .status("active")
                .emailApplications(true).emailUpdates(true).emailReminders(true)
                .pushApplications(false).pushUpdates(false).pushReminders(false)
                // Phase 6B — self-registered accounts start unverified.
                .emailVerified(false)
                .build();

        return UserResponse.fromEntity(repo.save(u));
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return repo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }

    /**
     * Phase 7 — apply a partial profile update to the user identified by
     * email. Only the fields whose value is non-null on the request are
     * written — matches PATCH semantics. Returns the refreshed projection.
     *
     * Email + role are deliberately not modifiable here; firstName/lastName
     * may not be blank (the column is {@code nullable = false}). Each
     * notification boolean is independent so the frontend can toggle one
     * without trampling the others.
     *
     * Blank-but-present strings (e.g. {@code "   "}) for firstName/lastName
     * are rejected with a 400 — the frontend's `buildPatch` strips those
     * before sending, so a request that still contains one is a caller
     * bug. Optional fields (phone/bio/location) treat blank as "clear",
     * which is the natural intent of an empty input field.
     */
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest req) {
        // First, reject blank firstName/lastName on the RAW request —
        // before normalization collapses whitespace to null. Otherwise a
        // buggy client sending "   " would silently no-op and leave the
        // server believing the user changed their name when nothing
        // actually happened.
        if (req.firstName() != null && req.firstName().trim().isBlank()) {
            throw new IllegalArgumentException("firstName must not be blank");
        }
        if (req.lastName() != null && req.lastName().trim().isBlank()) {
            throw new IllegalArgumentException("lastName must not be blank");
        }

        UpdateProfileRequest n = req.normalized();
        User u = findByEmail(email);

        if (n.firstName() != null) u.setFirstName(n.firstName());
        if (n.lastName()  != null) u.setLastName(n.lastName());

        // Optional fields — null means "clear"; non-null means "set".
        if (n.phone()    != null) u.setPhone(n.phone());
        if (n.bio()      != null) u.setBio(n.bio());
        if (n.location() != null) u.setLocation(n.location());

        // Notification booleans — each is its own independent flag.
        if (n.emailApplications() != null) u.setEmailApplications(n.emailApplications());
        if (n.emailUpdates()      != null) u.setEmailUpdates(n.emailUpdates());
        if (n.emailReminders()    != null) u.setEmailReminders(n.emailReminders());
        if (n.pushApplications()  != null) u.setPushApplications(n.pushApplications());
        if (n.pushUpdates()       != null) u.setPushUpdates(n.pushUpdates());
        if (n.pushReminders()     != null) u.setPushReminders(n.pushReminders());

        // save() is technically a no-op in the same session but harmless;
        // explicit so the JPA flush happens before the response is built.
        return UserResponse.fromEntity(repo.save(u));
    }
}
