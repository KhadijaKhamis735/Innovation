// ─────────────────────────────────────────────────────────────
// __tests__/context/AuthContext.test.js
// ─────────────────────────────────────────────────────────────
// Phase 7 — pin the AuthContext's hydrate → setUser lifecycle that
// the Settings screen depends on. Tests run against fake timers so
// the hydrate promise resolves synchronously.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { authApi } from '../../src/api/client';
import { clearTokens } from '../../src/api/tokenStore';

// Mock the token store so the provider doesn't try to read SecureStore.
jest.mock('../../src/api/tokenStore', () => ({
  getAccessToken: jest.fn(async () => null),
  getRefreshToken: jest.fn(async () => null),
  setTokens: jest.fn(async () => undefined),
  clearTokens: jest.fn(async () => undefined),
}));

// Spy on the auth client so clearSession's "no network call"
// contract can be asserted. The real module is used otherwise.
jest.mock('../../src/api/client', () => {
  const actual = jest.requireActual('../../src/api/client');
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      logout: jest.fn(async () => undefined),
    },
  };
});

// Helper: a consumer that exposes the current value via @testing-library.
function AuthProbe({ onReady }) {
  const { user, role, hydrated, isAuthenticated } = useAuth();
  React.useEffect(() => {
    if (hydrated) onReady({ user, role, isAuthenticated });
  }, [hydrated, user, role, isAuthenticated, onReady]);
  return <Text testID="probe">{user ? user.email : 'anon'}</Text>;
}

describe('AuthContext', () => {
  test('starts with no user, hydrated after mount', async () => {
    let captured = null;
    render(
      <AuthProvider>
        <AuthProbe onReady={(v) => (captured = v)} />
      </AuthProvider>,
    );
    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured.user).toBeNull();
    expect(captured.role).toBeNull();
    expect(captured.isAuthenticated).toBe(false);
  });

  test('setUser updates the user + role + isAuthenticated', async () => {
    let captured = null;
    function Setter() {
      const { setUser, user, role, isAuthenticated, hydrated } = useAuth();
      React.useEffect(() => {
        if (hydrated && !user) {
          setUser({
            id: 7, email: 'k@example.com', firstName: 'K', lastName: 'K',
            role: 'innovator', sector: null, status: 'active',
            phone: null, bio: null, location: null, avatarUrl: null,
            emailVerified: true,
            emailApplications: true, emailUpdates: true, emailReminders: true,
            pushApplications: false, pushUpdates: false, pushReminders: false,
          });
        }
      }, [hydrated, user, setUser]);
      React.useEffect(() => {
        if (user) captured = { user, role, isAuthenticated };
      }, [user, role, isAuthenticated]);
      return <Text testID="probe">{user?.email ?? 'anon'}</Text>;
    }
    render(
      <AuthProvider>
        <Setter />
      </AuthProvider>,
    );
    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured.user.email).toBe('k@example.com');
    expect(captured.role).toBe('innovator');
    expect(captured.isAuthenticated).toBe(true);
  });

  // ── Phase 2 — clearSession is strictly local. ────────────────
  // ResetPasswordScreen calls clearSession() after the backend has
  // already revoked every refresh-token family. We must NOT fire a
  // /api/mobile/auth/logout request — the refresh token is server-side
  // dead and the call would just 401. This test pins that contract.
  test('clearSession wipes tokens + user and does NOT call authApi.logout', async () => {
    const { authApi: spiedAuthApi } = require('../../src/api/client');
    const { clearTokens: clearTokensSpy } = require('../../src/api/tokenStore');
    clearTokensSpy.mockClear();
    spiedAuthApi.logout.mockClear();

    // A history of (user, isAuthenticated) pairs observed by the probe.
    const history = [];
    let actions = null;

    function Probe() {
      const { setUser, clearSession, user, isAuthenticated } = useAuth();
      actions = { setUser, clearSession };
      React.useEffect(() => {
        history.push({ user: user?.email ?? null, isAuthenticated });
      }, [user, isAuthenticated]);
      return <Text testID="probe">{user ? user.email : 'anon'}</Text>;
    }

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    // Seed a user so clearSession has something to wipe.
    await act(async () => {
      actions.setUser({
        id: 9, email: 'after-reset@example.com', firstName: 'A', lastName: 'R',
        role: 'innovator', sector: null, status: 'active',
        phone: null, bio: null, location: null, avatarUrl: null,
        emailVerified: true,
        emailApplications: true, emailUpdates: true, emailReminders: true,
        pushApplications: false, pushUpdates: false, pushReminders: false,
      });
    });

    // Wait for the seed to render.
    await waitFor(() =>
      expect(history.find((h) => h.user === 'after-reset@example.com')).toBeDefined()
    );

    // Now wipe the session.
    await act(async () => {
      await actions.clearSession();
    });

    // The provider re-rendered with user=null.
    await waitFor(() =>
      expect(history.at(-1)).toEqual({ user: null, isAuthenticated: false })
    );

    // clearTokens was called exactly once by clearSession.
    expect(clearTokensSpy).toHaveBeenCalledTimes(1);

    // THE LOAD-BEARING assertion: clearSession made no network call.
    expect(spiedAuthApi.logout).not.toHaveBeenCalled();
  });
});
