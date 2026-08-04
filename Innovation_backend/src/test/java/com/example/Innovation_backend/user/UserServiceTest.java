package com.example.Innovation_backend.user;

import com.example.Innovation_backend.user.dto.UpdateProfileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Phase 7 — service-level coverage for {@link UserService#updateProfile}.
 *
 * The controller test mocks this service, so the blank-firstName /
 * blank-lastName rejection isn't covered at the controller boundary
 * without explicit asserts. These tests pin the service contract:
 *   - blank firstName/lastName → 400
 *   - partial body only writes the supplied fields
 *   - notification booleans don't trample each other
 *   - unknown user → IllegalArgumentException
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository repo;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private UserService userService;

    private User u;

    @BeforeEach
    void setUp() {
        u = User.builder()
                .id(1L)
                .email("phase7@example.com")
                .password("hash")
                .firstName("Khadija")
                .lastName("Khamis")
                .role(Role.INNOVATOR)
                .status("active")
                .emailApplications(true)
                .emailUpdates(true)
                .emailReminders(true)
                .pushApplications(false)
                .pushUpdates(false)
                .pushReminders(false)
                .emailVerified(true)
                .build();
        // Lenient — some tests override findByEmail to simulate a missing user.
        org.mockito.Mockito.lenient().when(repo.findByEmail(anyString())).thenReturn(Optional.of(u));
        org.mockito.Mockito.lenient().when(repo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void partialUpdate_onlyTouchesSuppliedFields() {
        var resp = userService.updateProfile("phase7@example.com",
                new UpdateProfileRequest(null, null, "+255700000111", null, null,
                        null, null, null, null, null, null));

        assertEquals("+255700000111", resp.phone());
        // Untouched fields keep their original values.
        assertEquals("Khadija", resp.firstName());
        assertEquals("Khamis", resp.lastName());
        assertTrue(resp.emailApplications());
        assertFalse(resp.pushApplications());
    }

    @Test
    void blankFirstName_throws() {
        var bad = new UpdateProfileRequest("   ", null, null, null, null,
                null, null, null, null, null, null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.updateProfile("phase7@example.com", bad));
        assertEquals("firstName must not be blank", ex.getMessage());
        // Even though the call threw, the row should not have been saved.
        verify(repo, never()).save(any());
    }

    @Test
    void blankLastName_throws() {
        var bad = new UpdateProfileRequest(null, "", null, null, null,
                null, null, null, null, null, null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.updateProfile("phase7@example.com", bad));
        assertEquals("lastName must not be blank", ex.getMessage());
    }

    @Test
    void notificationsUpdate_independentBooleans() {
        var patch = new UpdateProfileRequest(null, null, null, null, null,
                false, null, false, true, null, true);
        var resp = userService.updateProfile("phase7@example.com", patch);

        // Updated booleans reflect the patch.
        assertFalse(resp.emailApplications());
        assertFalse(resp.emailReminders());
        assertTrue(resp.pushApplications());
        assertTrue(resp.pushReminders());
        // Untouched booleans keep their original values.
        assertTrue(resp.emailUpdates());
        assertFalse(resp.pushUpdates());
    }

    @Test
    void unknownUser_throws() {
        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());
        var patch = new UpdateProfileRequest("K", null, null, null, null,
                null, null, null, null, null, null);
        assertThrows(IllegalArgumentException.class,
                () -> userService.updateProfile("ghost@example.com", patch));
    }
}
