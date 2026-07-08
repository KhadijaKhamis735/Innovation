package com.example.Innovation_backend.user;

import com.example.Innovation_backend.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Self-service user endpoints. Admin-only endpoints (CRUD on users) live in Phase 3
 * under /api/admin/users.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    /** Current user from JWT — backed by the authenticated principal's email. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserDetails principal) {
        User u = userService.findByEmail(principal.getUsername());
        return UserResponse.fromEntity(u);
    }

    /** Health-check style endpoint for debugging roles. */
    @GetMapping("/me/role")
    public Map<String, String> myRole(@AuthenticationPrincipal UserDetails principal) {
        // For Phase 2 we synthesize authority from the JWT claim via the principal's authorities.
        String first = principal.getAuthorities().stream()
                .findFirst()
                .map(Object::toString)
                .orElse("ROLE_ANONYMOUS");
        return Map.of("email", principal.getUsername(), "authority", first);
    }
}
