// ─────────────────────────────────────────────────────────────
// AuthContext
// ─────────────────────────────────────────────────────────────
// Source of truth for the authenticated user on the React Native
// app. Holds nothing but the UserResponse + a `hydrated` flag;
// tokens live in SecureStore via `api/tokenStore.js` and the
// client (`api/client.js`) handles refresh transparently.
//
// Lifecycle:
//   - On mount, if SecureStore holds an access token we call
//     GET /api/mobile/auth/me to validate it. If that 401s, the
//     client's single-flight refresh runs once; if that also
//     fails, we clear tokens and `user` stays null.
//   - signIn / signUp call the backend, store tokens, setUser.
//   - signOut POSTs /logout (best-effort) then clears tokens.
//
// Role is exposed as a lowercase string ('innovator' | 'funder' |
// 'admin'). Navigation should always read `role` from here, never
// from a hardcoded toggle.
// ─────────────────────────────────────────────────────────────
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { authApi, ApiError } from '../api/client';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '../api/tokenStore';

const AuthContext = createContext(null);

/**
 * Provider. Mount once, near the root (alongside the existing
 * AppProvider). Children render nothing while we hydrate so the
 * stack navigator can choose the right initial route.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  // Track the latest user so callbacks don't see stale state.
  const userRef = useRef(null);
  useEffect(() => { userRef.current = user; }, [user]);

  // ── Hydrate on mount ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const access = await getAccessToken();
        if (!access) {
          if (!cancelled) setHydrated(true);
          return;
        }
        // /me will trigger the client's single-flight refresh on 401.
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        // Refresh already cleared the tokens on failure, so just
        // leave user=null and let the navigator route to login.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── signIn ──────────────────────────────────────────────────
  const signIn = useCallback(async ({ email, password }) => {
    setSigningIn(true);
    try {
      const data = await authApi.login({ email, password });
      await setTokens({ accessToken: data.token, refreshToken: data.refreshToken });
      setUser(data.user);
      return data.user;
    } finally {
      setSigningIn(false);
    }
  }, []);

  // ── signUp ──────────────────────────────────────────────────
  const signUp = useCallback(async (payload) => {
    setSigningIn(true);
    try {
      const data = await authApi.register(payload);
      await setTokens({ accessToken: data.token, refreshToken: data.refreshToken });
      setUser(data.user);
      return data.user;
    } finally {
      setSigningIn(false);
    }
  }, []);

  // ── signOut ─────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    const refresh = await getRefreshToken();
    try {
      // Best-effort: ignore network errors so the user is never
      // stranded on logout.
      await authApi.logout(refresh ?? undefined);
    } catch {
      // swallow
    }
    await clearTokens();
    setUser(null);
  }, []);

  // ── refreshSession (manual — used after deep-link verify etc.) ─
  const refreshSession = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(() => {
    const role = user?.role ?? null;
    return {
      user,
      role,
      isAuthenticated: !!user,
      hydrated,
      signingIn,
      signIn,
      signUp,
      signOut,
      refreshSession,
      setUser,
    };
  }, [user, hydrated, signingIn, signIn, signUp, signOut, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

export { ApiError };