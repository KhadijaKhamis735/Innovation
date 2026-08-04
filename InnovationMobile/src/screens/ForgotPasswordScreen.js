// ─────────────────────────────────────────────────────────────
// ForgotPasswordScreen
// ─────────────────────────────────────────────────────────────
// Asks for the user's email and POSTs to /api/mobile/auth/forgot-password.
// The backend always returns 202 (whether the email is registered or
// not) for anti-enumeration, so any non-network error still advances
// the user to CheckEmail — only `status === 0` (network down) keeps
// them here with a retry message. This matches the forgot-password
// contract on the web side.
//
// Email validation is the same light touch as LoginScreen (just
// non-empty + @). The backend re-validates with @Email and returns
// 400 for malformed input, which surfaces in the error box.
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(trimmed);
      navigation.replace('CheckEmail', { email: trimmed, purpose: 'reset' });
    } catch (e) {
      // Treat anything that's not a network failure as "we've asked
      // the server; show the next screen anyway" — the backend's
      // anti-enumeration contract means 4xx other than validation
      // aren't meaningful here. Only network errors keep us put.
      if (e instanceof ApiError && e.status === 0) {
        setError('Network error — please check your connection and try again.');
      } else {
        navigation.replace('CheckEmail', { email: trimmed, purpose: 'reset' });
      }
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
              onPress={() => navigation.navigate('Login')}
              style={styles.brand}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.brandLogo}
              >
                <Text style={styles.brandLogoIcon}>⚡</Text>
              </LinearGradient>
              <View>
                <Text style={styles.brandName}>Innovation Management</Text>
                <Text style={styles.brandTagline}>Reset your password</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.formSection}>
            <Text style={styles.formHeading}>Forgot password</Text>
            <Text style={styles.formSubheading}>
              Enter the email on your account. We'll send a link to set a new password.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email address</Text>
              <TextInput
                style={styles.formInput}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.white} size="small" />
                  <Text style={styles.submitBtnText}>Sending link…</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>Send reset link</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.switchText}>
              Remembered it?{' '}
              <Text
                style={styles.switchLink}
                onPress={() => navigation.navigate('Login')}
              >
                Back to sign in
              </Text>
            </Text>
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

  switchText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 24,
  },
  switchLink: { color: colors.primary, fontWeight: '700' },
});
