package com.example.Innovation_backend.user;

import com.example.Innovation_backend.user.dto.RegisterRequest;
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
                .build();

        return UserResponse.fromEntity(repo.save(u));
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return repo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }
}
