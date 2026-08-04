// ─────────────────────────────────────────────────────────────
// VerifyEmailScreen
// ─────────────────────────────────────────────────────────────
// Reached by deep-link `innovationmobile://verify?token=…`:
//   - cold start (app closed)
//   - warm start (app in the background)
//
// Three states: verifying / success / error. A single-use token
// must not be consumed twice even if the screen re-renders; the
// `consumedRef` guards the consume-effect. The raw token is never
// rendered or logged.
//
// On success: if a session exists (the user previously signed in
// and the JWT is still valid OR refreshable), we re-call /me so
// `emailVerified` flips to true and the user lands on their
// dashboard. Otherwise we land on Login with a banner — the user
// can sign in and the verified state will follow from the JWT.
//
// On error: show the backend's mapped message ("Verification token
// invalid" / "Token expired" / "Token already used") and offer a
// "Resend" link to CheckEmailScreen.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { authApi, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailScreen({ route, navigation }) {
  const token = route.params?.token;
  const { user, refreshSession } = useAuth();

  const [state, setState] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const consumedRef = useRef(false);

  useEffect(() => {
    // Cold-start + warm-start both arrive here. Guard against
    // double-consumption if the navigator re-renders or the user
    // re-focuses the app.
    if (consumedRef.current) return;
    consumedRef.current = true;

    if (!token) {
      setState('error');
      setErrorMessage('This link is missing its verification token. Please request a new verification email.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await authApi.verifyEmail(token);
        // If the user has a valid session, refresh so the freshly-verified
        // `emailVerified` flag shows up before routing to a dashboard.
        // If not (closed-app path), /me would 401 — silently skip.
        if (user) {
          try {
            await refreshSession();
          } catch {
            // 401 here is fine — user must sign in again. We still landed
            // them on the right place below.
          }
        }
        if (cancelled) return;
        setState('success');
        // Brief pause so the success state is visible before navigating.
        setTimeout(() => {
          if (cancelled) return;
          if (user?.role === 'funder') {
            navigation.replace('FunderDashboard');
          } else if (user) {
            navigation.replace('Dashboard');
          } else {
            navigation.replace('Login', { banner: 'Email verified. Please sign in.' });
          }
        }, 900);
      } catch (e) {
        if (cancelled) return;
        setState('error');
        setErrorMessage(
          e instanceof ApiError
            ? e.message || 'This verification link is no longer valid.'
            : 'This verification link is no longer valid.',
        );
      }
    })();

    return () => { cancelled = true; };
    // We intentionally don't include user/refreshSession in deps — the
    // consume-once guard is more important than picking up stale fresh
    // values mid-consumption.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['#1a1a2e', '#2d1f0f', '#1a1a2e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandHeader}
        >
          <View style={styles.brand}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.brandLogo}
            >
              <Text style={styles.brandLogoIcon}>⚡</Text>
            </LinearGradient>
            <View>
              <Text style={styles.brandName}>Innovation Management</Text>
              <Text style={styles.brandTagline}>Email verification</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          {state === 'verifying' && (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.heading}>Verifying your email…</Text>
              <Text style={styles.subheading}>This usually takes a moment.</Text>
            </>
          )}

          {state === 'success' && (
            <>
              <Text style={styles.icon}>✅</Text>
              <Text style={styles.heading}>Email verified</Text>
              <Text style={styles.subheading}>
                Taking you to your dashboard…
              </Text>
            </>
          )}

          {state === 'error' && (
            <>
              <Text style={styles.icon}>⚠️</Text>
              <Text style={styles.heading}>Verification failed</Text>
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  navigation.replace('CheckEmail', {
                    // user.email only available if they were signed in;
                    // CheckEmail handles missing/empty email gracefully.
                    email: user?.email ?? '',
                    purpose: 'verify',
                  })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Send a new verification email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.replace('Login')}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryBtnText}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollContent: { flexGrow: 1 },

  brandHeader: { paddingTop: 24, paddingBottom: 24, paddingHorizontal: 20 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandLogoIcon: { color: colors.white, fontSize: 22, fontWeight: '700' },
  brandName: { color: colors.white, fontWeight: '700', fontSize: 16 },
  brandTagline: { color: '#cbd5e1', fontSize: 12, marginTop: 2 },

  section: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  icon: { fontSize: 56, marginBottom: 12 },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },

  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 16,
    width: '100%',
  },
  errorText: { color: '#dc2626', fontSize: 13, textAlign: 'center' },

  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 3,
  },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },

  secondaryBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
