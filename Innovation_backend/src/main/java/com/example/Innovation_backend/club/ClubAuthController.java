package com.example.Innovation_backend.club;

import com.example.Innovation_backend.club.dto.ClubAuthResponse;
import com.example.Innovation_backend.club.dto.ClubLoginRequest;
import com.example.Innovation_backend.club.dto.ClubRegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

/**
 * Auth endpoints for the club surface (separate from /api/auth/*).
 *
 *   POST /api/club/auth/register   public — any of 4 categories
 *   POST /api/club/auth/login      public — members and leaders
 *   GET  /api/club/auth/me         auth   — current principal (member or leader)
 *
 * Email uniqueness is global across both club tables (and the main users
 * table, see ApplicationService's pre-check on /api/auth/register).
 */
@RestController
@RequestMapping("/api/club/auth")
@RequiredArgsConstructor
public class ClubAuthController {

    private final ClubAuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ClubAuthResponse> register(@Valid @RequestBody ClubRegisterRequest req) {
        ClubAuthResponse resp = authService.register(req);
        return ResponseEntity
                .created(URI.create("/api/club/members/" + resp.member().id()))
                .body(resp);
    }

    @PostMapping("/login")
    public ClubAuthResponse login(@Valid @RequestBody ClubLoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public Object me() {
        return authService.me();
    }
}