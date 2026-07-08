package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.security.JwtService;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import com.example.Innovation_backend.user.UserService;
import com.example.Innovation_backend.user.dto.LoginRequest;
import com.example.Innovation_backend.user.dto.RegisterRequest;
import com.example.Innovation_backend.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        UserResponse created = userService.register(req);
        // Re-fetch to get assigned id; in this case UserResponse already has it.
        return new AuthResponse(
                jwtService.issue(created.email(), created.id(), created.role().json()),
                created
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), u.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (!"active".equals(u.getStatus())) {
            throw new BadCredentialsException("Account is " + u.getStatus());
        }

        UserResponse ur = UserResponse.fromEntity(u);
        String token = jwtService.issue(u.getEmail(), u.getId(), u.getRole().json());
        return new AuthResponse(token, ur);
    }
}
