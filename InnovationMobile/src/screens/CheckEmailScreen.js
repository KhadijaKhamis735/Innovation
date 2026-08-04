// ─────────────────────────────────────────────────────────────
// CheckEmailScreen
// ─────────────────────────────────────────────────────────────
// Shown right after registration (purpose='verify') and after
// forgotten-password request (purpose='reset'). Offers three
// affordances:
//
//   1. "Open email app" — Linking.openURL('mailto:'). Best-effort;
//      guarded by canOpenURL. If no handler exists (rare on a real
//      device) we silently continue.
//   2. "Resend email" — re-triggers the same backend call. For
//      verify → POST /resend-verification-by-email; for reset →
//      POST /forgot-password. Both endpoints follow the same
//      anti-enumeration contract so we show a neutral success
//      regardless of outcome.
//   3. "Back to sign in" — navigation back to Login.
//
// IMPORTANT: server-side, every fresh `issue()` consumes any prior
// outstanding token for the principal. Without a 30-second cooldown
// a tap-happy user would invalidate their own link before they
// could tap it. The client cooldown does not make this race
// impossible — it just makes it unlikely.
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
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { authApi } from '../api/client';
import { clubAuthApi } from '../api/clubAuth';

const RESEND_COOLDOWN_MS = 30_000;

export default function CheckEmailScreen({ route, navigation }) {
  const email = route.params?.email ?? '';
  const purpose = route.params?.purpose ?? 'verify';

  const [resendStatus, setResendStatus] = useState('idle'); // 'idle' | 'sending' | 'sent'
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const cooldownRemaining = Math.max(0, cooldownUntil - now);
  const onCooldown = cooldownRemaining > 0;

  const isVerify = purpose === 'verify' || purpose === 'verify-club';
  const isClubVerify = purpose === 'verify-club';
  const heading = isVerify ? 'Verify your email' : 'Check your email';
  const subheading = isVerify
    ? "We sent a verification link to confirm your email. Tap the link in the email to continue — it expires in 24 hours."
    : "We sent a reset link. Tap it to set a new password — the link expires in 1 hour.";

  const handleResend = async () => {
    if (onCooldown || !email || resendStatus === 'sending') return;
    setResendStatus('sending');
    try {
      if (isClubVerify) {
        // Club surface — different controller, same anti-enumeration shape.
        await clubAuthApi.resendVerificationByEmail(email);
      } else if (isVerify) {
        await authApi.resendVerificationByEmail(email);
      } else {
        await authApi.forgotPassword(email);
      }
      setResendStatus('sent');
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_MS);
      // Fall back to the neutral idle copy after a short pause so the
      // button doesn't stay stuck on "Sent" forever.
      setTimeout(() => setResendStatus('idle'), 4000);
    } catch {
      // Anti-enumeration: from the user's point of view, success or
      // failure looks the same — we don't disclose account state.
      setResendStatus('sent');
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_MS);
      setTimeout(() => setResendStatus('idle'), 4000);
    }
  };

  const handleOpenMail = async () => {
    try {
      const canOpen = await Linking.canOpenURL('mailto:');
      if (canOpen) await Linking.openURL('mailto:');
    } catch {
      // No mail app — silently ignore. The resend path still works.
    }
  };

  const resendLabel = isVerify ? 'Resend verification email' : 'Resend reset email';
  const cooldownLabel = onCooldown
    ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s before resending`
    : resendLabel;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['#1a1a2e', '#2d1f0f', '#1a1a2e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandHeader}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Landing')}
            style={styles.brand}
            accessibilityRole="button"
            accessibilityLabel="Back to landing"
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.brandLogo}
            >
              <Text style={styles.brandLogoIcon}>⚡</Text>
            </LinearGradient>
            <View>
              <Text style={styles.brandName}>Innovation Management</Text>
              <Text style={styles.brandTagline}>Account security</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.icon}>{isVerify ? '✉️' : '🔑'}</Text>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.subheading}>{subheading}</Text>

          {email ? (
            <View style={styles.emailPill}>
              <Text style={styles.emailPillText}>{email}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.secondaryBtn, resendStatus === 'sending' && styles.btnDisabled]}
            onPress={handleResend}
            disabled={onCooldown || resendStatus === 'sending'}
            activeOpacity={0.85}
          >
            {resendStatus === 'sending' ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.secondaryBtnText}>Sending…</Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.secondaryBtnText,
                  onCooldown && styles.secondaryBtnTextDisabled,
                ]}
              >
                {cooldownLabel}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleOpenMail}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Open email app</Text>
          </TouchableOpacity>

          <Text style={styles.switchText}>
            <Text
              style={styles.switchLink}
              onPress={() => navigation.navigate('Login')}
            >
              Back to sign in
            </Text>
          </Text>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },

  emailPill: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 28,
  },
  emailPillText: { color: colors.primaryDark, fontWeight: '600', fontSize: 13 },

  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 3,
  },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },

  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: colors.white,
  },
  secondaryBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  secondaryBtnTextDisabled: { color: colors.textMuted },
  btnDisabled: { opacity: 0.6 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  switchText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 24,
  },
  switchLink: { color: colors.primary, fontWeight: '700' },
});
