package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.common.GlobalExceptionHandler;
import com.example.Innovation_backend.security.JwtAuthFilter;
import com.example.Innovation_backend.security.JwtService;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.UserService;
import com.example.Innovation_backend.user.dto.UserResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web-slice test for {@link MobileAuthController}. Mirrors the
 * {@link AuthControllerWebMvcTest} skeleton but asserts on JSON body
 * fields (token + refreshToken + user) instead of cookies — mobile
 * clients never touch the refresh cookie.
 *
 * What we cover:
 *   - Register: 201 with full JSON bundle; bean-validation failures (short
 *     password, no digit, missing email) → 400.
 *   - Login: 200 with full JSON bundle; bad credentials → 401.
 *   - Refresh: 200 with rotated pair; unknown raw token → 401; reused
 *     raw token → 401.
 *   - Logout: 204 with body, 204 with no body.
 *   - Verify: 200 / 400.
 *   - Resend: 202.
 *   - Forgot-password: 202 for known AND unknown email (anti-enumeration).
 *   - Reset-password: 204 / 400 / 401.
 *   - Endpoint path smoke test.
 */
@WebMvcTest(MobileAuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Import({GlobalExceptionHandler.class})
class MobileAuthControllerWebMvcTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;

    @MockBean private MobileAuthService mobileAuth;
    @MockBean private AuthService authService;
    @MockBean private UserService userService;
    @MockBean private EmailVerificationService emailVerification;
    @MockBean private PasswordResetService passwordReset;
    @MockBean private JwtService jwtService;
    @MockBean private JwtAuthFilter jwtAuthFilter;
    @MockBean private JavaMailSender javaMailSender;

    private static final UserResponse SAMPLE_USER = new UserResponse(
            1L, "u@example.com", "Khadija", "Khamis", "Khadija Khamis",
            Role.INNOVATOR, null, "active", null, null, null, null, false
    );

    private static final MobileAuthResponse SAMPLE_RESPONSE = new MobileAuthResponse(
            "access-jwt",
            "raw-refresh-token",
            Instant.now().plus(7, ChronoUnit.DAYS),
            SAMPLE_USER);

    @BeforeEach
    void setUp() {
        // Default happy-path stubs. Per-test overrides below.
        when(mobileAuth.register(any())).thenReturn(SAMPLE_RESPONSE);
        when(mobileAuth.login(any())).thenReturn(SAMPLE_RESPONSE);
        when(mobileAuth.refresh(anyString())).thenReturn(SAMPLE_RESPONSE);
    }

    // ── POST /api/mobile/auth/register ────────────────────────────────

    @Test
    void register_valid_returns201WithBundle() throws Exception {
        String body = """
                {
                  "email": "u@example.com",
                  "password": "Secret1",
                  "role": "innovator",
                  "firstName": "Khadija",
                  "lastName": "Khamis"
                }
                """;

        mvc.perform(post("/api/mobile/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("access-jwt"))
                .andExpect(jsonPath("$.refreshToken").value("raw-refresh-token"))
                .andExpect(jsonPath("$.user.email").value("u@example.com"))
                .andExpect(jsonPath("$.refreshExpiresAt").exists());
    }

    @Test
    void register_shortPassword_returns400() throws Exception {
        mvc.perform(post("/api/mobile/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {
                                  "email": "u@example.com",
                                  "password": "abc",
                                  "role": "innovator",
                                  "firstName": "Khadija",
                                  "lastName": "Khamis"
                                }
                                """))
                .andExpect(status().isBadRequest());
        verify(mobileAuth, never()).register(any());
    }

    @Test
    void register_passwordWithoutDigit_returns400() throws Exception {
        mvc.perform(post("/api/mobile/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {
                                  "email": "u@example.com",
                                  "password": "NoDigitsHere",
                                  "role": "innovator",
                                  "firstName": "Khadija",
                                  "lastName": "Khamis"
                                }
                                """))
                .andExpect(status().isBadRequest());
        verify(mobileAuth, never()).register(any());
    }

    @Test
    void register_missingEmail_returns400() throws Exception {
        mvc.perform(post("/api/mobile/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {
                                  "password": "Secret1",
                                  "role": "innovator",
                                  "firstName": "Khadija",
                                  "lastName": "Khamis"
                                }
                                """))
                .andExpect(status().isBadRequest());
        verify(mobileAuth, never()).register(any());
    }

    // ── POST /api/mobile/auth/login ───────────────────────────────────

    @Test
    void login_success_returns200WithBundle() throws Exception {
        mvc.perform(post("/api/mobile/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"u@example.com\",\"password\":\"Secret1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access-jwt"))
                .andExpect(jsonPath("$.refreshToken").value("raw-refresh-token"))
                .andExpect(jsonPath("$.user.email").value("u@example.com"));
    }

    @Test
    void login_badCredentials_returns401() throws Exception {
        when(mobileAuth.login(any()))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        mvc.perform(post("/api/mobile/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"u@example.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_missingEmail_returns400() throws Exception {
        mvc.perform(post("/api/mobile/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"Secret1\"}"))
                .andExpect(status().isBadRequest());
    }

    // ── POST /api/mobile/auth/refresh ─────────────────────────────────

    @Test
    void refresh_success_returns200() throws Exception {
        mvc.perform(post("/api/mobile/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"old-raw\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access-jwt"))
                .andExpect(jsonPath("$.refreshToken").value("raw-refresh-token"));
        verify(mobileAuth, times(1)).refresh("old-raw");
    }

    @Test
    void refresh_invalidToken_returns401() throws Exception {
        when(mobileAuth.refresh("bad"))
                .thenThrow(new RefreshTokenService.InvalidRefreshException("bad"));

        mvc.perform(post("/api/mobile/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"bad\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_reuseDetected_returns401() throws Exception {
        when(mobileAuth.refresh("revoked"))
                .thenThrow(new RefreshTokenService.ReuseDetectedException("reuse"));

        mvc.perform(post("/api/mobile/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"revoked\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_missingToken_returns400() throws Exception {
        mvc.perform(post("/api/mobile/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
        verify(mobileAuth, never()).refresh(anyString());
    }

    // ── POST /api/mobile/auth/logout ──────────────────────────────────

    @Test
    void logout_withToken_returns204_andDelegatesToService() throws Exception {
        mvc.perform(post("/api/mobile/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"old-raw\"}"))
                .andExpect(status().isNoContent());
        verify(mobileAuth, times(1)).logout("old-raw");
    }

    @Test
    void logout_withEmptyBody_returns204_andIsANoop() throws Exception {
        mvc.perform(post("/api/mobile/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNoContent());
        verify(mobileAuth, times(1)).logout(null);
    }

    // ── GET /api/mobile/auth/verify ───────────────────────────────────

    @Test
    void verify_validToken_returns200() throws Exception {
        mvc.perform(get("/api/mobile/auth/verify").param("token", "good-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));
    }

    @Test
    void verify_invalidToken_returns400() throws Exception {
        doThrow(new EmailVerificationService.InvalidVerificationTokenException("bad token"))
                .when(authService).verifyEmail(anyString());

        mvc.perform(get("/api/mobile/auth/verify").param("token", "bad-token"))
                .andExpect(status().isBadRequest());
    }

    // ── POST /api/mobile/auth/resend-verification ─────────────────────

    @Test
    void resendVerification_returns202() throws Exception {
        mvc.perform(post("/api/mobile/auth/resend-verification"))
                .andExpect(status().isAccepted());
        verify(authService, times(1)).resendVerification();
    }

    // ── POST /api/mobile/auth/forgot-password ─────────────────────────

    @Test
    void forgotPassword_knownEmail_returns202() throws Exception {
        when(passwordReset.issueForEmail("u@example.com")).thenReturn(java.util.Optional.of(
                new PasswordResetService.Issued(
                        PasswordResetToken.builder().id(1L).build(),
                        "raw-token")));

        mvc.perform(post("/api/mobile/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"u@example.com\"}"))
                .andExpect(status().isAccepted());
    }

    @Test
    void forgotPassword_unknownEmail_returns202_antiEnumeration() throws Exception {
        when(passwordReset.issueForEmail("nobody@example.com"))
                .thenReturn(java.util.Optional.empty());

        mvc.perform(post("/api/mobile/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@example.com\"}"))
                .andExpect(status().isAccepted());
    }

    @Test
    void forgotPassword_invalidEmailFormat_returns400() throws Exception {
        mvc.perform(post("/api/mobile/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest());
        verify(passwordReset, never()).issueForEmail(anyString());
    }

    // ── POST /api/mobile/auth/reset-password ──────────────────────────

    @Test
    void resetPassword_valid_returns204() throws Exception {
        mvc.perform(post("/api/mobile/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\",\"password\":\"Newpass1\"}"))
                .andExpect(status().isNoContent());
        verify(passwordReset, times(1)).consume("raw-token", "Newpass1");
    }

    @Test
    void resetPassword_shortPassword_returns400() throws Exception {
        mvc.perform(post("/api/mobile/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\",\"password\":\"abc\"}"))
                .andExpect(status().isBadRequest());
        verify(passwordReset, never()).consume(anyString(), anyString());
    }

    @Test
    void resetPassword_passwordWithoutDigit_returns400() throws Exception {
        mvc.perform(post("/api/mobile/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\",\"password\":\"NoDigitsHere\"}"))
                .andExpect(status().isBadRequest());
        verify(passwordReset, never()).consume(anyString(), anyString());
    }

    @Test
    void resetPassword_invalidToken_returns400() throws Exception {
        doThrow(new PasswordResetService.InvalidResetTokenException("bad token"))
                .when(passwordReset).consume("raw-token", "Newpass1");

        mvc.perform(post("/api/mobile/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\",\"password\":\"Newpass1\"}"))
                .andExpect(status().isBadRequest());
    }

    // ── Endpoint path smoke ───────────────────────────────────────────

    @Test
    void endpointPaths_areExactlyAsDocumented() throws Exception {
        // Register
        mvc.perform(post("/api/mobile/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        // Login
        mvc.perform(post("/api/mobile/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        // Refresh — empty body fails @NotBlank
        mvc.perform(post("/api/mobile/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        // Logout — empty body is allowed (204)
        mvc.perform(post("/api/mobile/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isNoContent());
        // Resend
        mvc.perform(post("/api/mobile/auth/resend-verification"))
                .andExpect(status().isAccepted());
        // Forgot
        mvc.perform(post("/api/mobile/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        // Reset
        mvc.perform(post("/api/mobile/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }
}