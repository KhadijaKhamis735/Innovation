// ─────────────────────────────────────────────────────────────
// ResetPasswordScreen
// ─────────────────────────────────────────────────────────────
// Reached by deep-link `innovationmobile://reset-password?token=…`.
// The token lives in route.params only; we never render it (and
// pass `undefined` to the API if it's somehow missing).
//
// Validates client-side the same way the backend does:
//   - ≥6 chars, ≤100 chars, contains a digit
//   - new + confirm match
// Mirrors backend validators so users don't get a 400 they could
// have caught locally.
//
// On success the backend returns 204 with empty body — meaning
// every refresh-token family for that user has been revoked. We
// MUST clear local tokens immediately; otherwise SecureStore keeps
// a refresh token that the server has now rejected, and the next
// authenticated request would 401 with a useless auto-refresh.
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { authApi, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

const requirements = (pw, confirm) => [
  { text: 'At least 6 characters', met: pw.length >= 6 },
  { text: 'No more than 100 characters', met: pw.length > 0 && pw.length <= 100 },
  { text: 'Contains a number', met: /\d/.test(pw) },
  { text: 'Passwords match', met: pw.length > 0 && pw === confirm },
];

export default function ResetPasswordScreen({ route, navigation }) {
  const token = route.params?.token;
  const { clearSession } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checks = useMemo(() => requirements(password, confirm), [password, confirm]);

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.heading}>Invalid link</Text>
          <Text style={styles.subheading}>
            This reset link is missing its token. Please request a new one from the
            forgot-password screen.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.replace('ForgotPassword')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Send another reset email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    setError('');
    if (password.length < 6 || password.length > 100) {
      setError('Password must be between 6 and 100 characters.');
      return;
    }
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      // Backend returns 204 → apiRequest parses an empty body as null,
      // which is fine — we don't need the response payload.
      await authApi.resetPassword(token, password);
      // Backend has revoked every refresh family. Clear local state
      // BEFORE navigating so the navigator is mounted cleanly on Login
      // without any stale token. clearSession is local-only — no
      // network call to /logout — because the server has already
      // invalidated every refresh family for this principal.
      await clearSession();
      navigation.replace('Login', { banner: 'Password reset. Please sign in with your new password.' });
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message || 'Could not reset your password. The link may have expired.'
          : 'Could not reset your password. The link may have expired.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
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
                <Text style={styles.brandTagline}>Set a new password</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.formSection}>
            <Text style={styles.formHeading}>Reset password</Text>
            <Text style={styles.formSubheading}>
              Choose a new password for your account.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>New password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.formInput, styles.passwordInput]}
                  placeholder="Enter a new password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Confirm new password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.formInput, styles.passwordInput]}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textMuted}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showConfirm}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm(!showConfirm)}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {password.length > 0 && (
              <View style={styles.requirements}>
                {checks.map((req, i) => (
                  <View key={i} style={styles.requirementRow}>
                    <View
                      style={[
                        styles.requirementIcon,
                        req.met && styles.requirementIconMet,
                      ]}
                    >
                      <Text
                        style={[
                          styles.requirementIconText,
                          req.met && styles.requirementIconTextMet,
                        ]}
                      >
                        {req.met ? '✓' : '○'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.requirementText,
                        req.met && styles.requirementTextMet,
                      ]}
                    >
                      {req.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.white} size="small" />
                  <Text style={styles.submitBtnText}>Saving…</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>Set new password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  keyboardView: { flex: 1 },
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

  formSection: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  formHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  formSubheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },

  section: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 64,
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
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },

  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  errorText: { color: '#dc2626', fontSize: 13 },

  formGroup: { marginBottom: 18 },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    width: '100%',
  },
  passwordWrapper: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  eyeIcon: { fontSize: 18 },

  requirements: { marginTop: 4, marginBottom: 16 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  requirementIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  requirementIconMet: { backgroundColor: '#22c55e' },
  requirementIconText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  requirementIconTextMet: { color: colors.white },
  requirementText: { fontSize: 12, color: colors.textMuted },
  requirementTextMet: { color: '#22c55e', fontWeight: '500' },

  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 3,
  },
  submitBtnDisabled: { opacity: 0.65 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },

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
});
