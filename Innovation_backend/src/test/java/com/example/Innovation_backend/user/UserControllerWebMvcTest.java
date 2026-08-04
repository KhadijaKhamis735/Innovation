package com.example.Innovation_backend.user;

import com.example.Innovation_backend.common.GlobalExceptionHandler;
import com.example.Innovation_backend.security.JwtAuthFilter;
import com.example.Innovation_backend.security.JwtService;
import com.example.Innovation_backend.user.dto.UpdateProfileRequest;
import com.example.Innovation_backend.user.dto.UserResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web-slice test for {@link UserController#updateMe} (Phase 7).
 *
 * The GET contract on /api/users/me is already covered by the auth tests;
 * this class focuses on the PATCH surface:
 *
 *   - All-fields-null body → 200 + full projection (no-op).
 *   - Partial body → 200 + only the supplied fields are written.
 *   - Empty body → 200 (every field is optional).
 *   - firstName/lastName not-blank enforcement (column is non-null).
 *   - Length violations on phone/bio/location → 400 via bean-validation.
 *   - Notification-only PATCH leaves profile fields alone.
 *   - User not found → 400 (the service maps to IllegalArgumentException).
 *   - Endpoint smoke test.
 */
@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Import({GlobalExceptionHandler.class})
class UserControllerWebMvcTest {

    @Autowired private MockMvc mvc;

    @MockBean private UserService userService;
    @MockBean private UserRepository userRepository;
    @MockBean private JwtService jwtService;
    @MockBean private JwtAuthFilter jwtAuthFilter;
    @MockBean private JavaMailSender javaMailSender;

    private static final String CALLER = "caller@example.com";

    private static UserResponse full(long id, String email) {
        return new UserResponse(
                id, email, "Khadija", "Khamis", "Khadija Khamis",
                Role.INNOVATOR, null, "active",
                "+255700000111", "I build things.", "Dar es Salaam", null,
                true,
                true, true, true, false, false, false
        );
    }

    @BeforeEach
    void wirePrincipal() {
        // JwtAuthFilter is mocked out (addFilters=false), so push a principal
        // into the SecurityContext manually. @AuthenticationPrincipal UserDetails
        // requires the principal to actually be a UserDetails instance —
        // passing a String here would resolve to null in the controller.
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername(CALLER)
                .password("n/a")
                .authorities("ROLE_INNOVATOR").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        principal, null, principal.getAuthorities())
        );
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void patch_emptyBody_returns200AndFullProjection() throws Exception {
        when(userService.updateProfile(eq(CALLER), any(UpdateProfileRequest.class)))
                .thenReturn(full(1L, CALLER));

        mvc.perform(patch("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(CALLER))
                .andExpect(jsonPath("$.firstName").value("Khadija"))
                .andExpect(jsonPath("$.emailApplications").value(true))
                .andExpect(jsonPath("$.pushReminders").value(false));
    }

    @Test
    void patch_partialBody_returns200AndAppliedFields() throws Exception {
        UserResponse updated = new UserResponse(
                1L, CALLER, "Khadija", "Khamis", "Khadija Khamis",
                Role.INNOVATOR, null, "active",
                "+255700000222", null, null, null, true,
                true, true, true, false, false, false
        );
        when(userService.updateProfile(eq(CALLER), any(UpdateProfileRequest.class)))
                .thenReturn(updated);

        mvc.perform(patch("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"phone":"+255700000222"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("+255700000222"));
    }

    @Test
    void patch_notificationsOnly_leavesProfileFieldsUntouched() throws Exception {
        UserResponse updated = new UserResponse(
                1L, CALLER, "Khadija", "Khamis", "Khadija Khamis",
                Role.INNOVATOR, null, "active",
                null, null, null, null, true,
                false, true, false, true, false, true
        );
        when(userService.updateProfile(eq(CALLER), any(UpdateProfileRequest.class)))
                .thenReturn(updated);

        mvc.perform(patch("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {
                                  "emailApplications": false,
                                  "emailReminders": false,
                                  "pushApplications": true,
                                  "pushReminders": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailApplications").value(false))
                .andExpect(jsonPath("$.emailUpdates").value(true))
                .andExpect(jsonPath("$.emailReminders").value(false))
                .andExpect(jsonPath("$.pushApplications").value(true))
                .andExpect(jsonPath("$.pushUpdates").value(false))
                .andExpect(jsonPath("$.pushReminders").value(true));
    }

    @Test
    void patch_blankFirstName_returns400() throws Exception {
        // The service strips / rejects whitespace before setFirstName.
        // A "   " body must NOT be silently dropped — the column is
        // nullable=false, so silently no-oping would leave the user in
        // a broken state if their save came from a buggy client.
        when(userService.updateProfile(eq(CALLER), any(UpdateProfileRequest.class)))
                .thenThrow(new IllegalArgumentException("firstName must not be blank"));

        mvc.perform(patch("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"firstName":"   "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("firstName must not be blank"));
    }

    @Test
    void patch_blankLastName_returns400() throws Exception {
        when(userService.updateProfile(eq(CALLER), any(UpdateProfileRequest.class)))
                .thenThrow(new IllegalArgumentException("lastName must not be blank"));

        mvc.perform(patch("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"lastName":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("lastName must not be blank"));
    }

    @Test
    void patch_bioOver500Chars_returns400() throws Exception {
        String over = "a".repeat(501);
        mvc.perform(patch("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"bio":"%s"}
                                """.formatted(over)))
                .andExpect(status().isBadRequest());
        verify(userService, never()).updateProfile(anyString(), any());
    }

    @Test
    void patch_phoneOver32Chars_returns400() throws Exception {
        String over = "1".repeat(33);
        mvc.perform(patch("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"phone":"%s"}
                                """.formatted(over)))
                .andExpect(status().isBadRequest());
        verify(userService, never()).updateProfile(anyString(), any());
    }

    @Test
    void patch_userNotFound_returns400() throws Exception {
        when(userService.updateProfile(eq(CALLER), any(UpdateProfileRequest.class)))
                .thenThrow(new IllegalArgumentException("User not found: " + CALLER));

        mvc.perform(patch("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"firstName":"Khadija"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patch_endpointPath_smoke() throws Exception {
        when(userService.updateProfile(eq(CALLER), any(UpdateProfileRequest.class)))
                .thenReturn(full(1L, CALLER));

        // Smoke test — the route is wired up and reaches the service.
        mvc.perform(patch("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"firstName":"Khadija"}
                                """))
                .andExpect(status().isOk());
        verify(userService).updateProfile(eq(CALLER), any(UpdateProfileRequest.class));
    }
}
