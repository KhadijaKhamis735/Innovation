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
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const signedInUser = await signIn({ email: email.trim(), password });
      // Backend role decides where we go. The `role` state is only
      // a hint for the UI; if the user picked the wrong toggle, the
      // backend will route them to the correct dashboard anyway.
      if (signedInUser?.role === 'funder') {
        navigation.replace('FunderDashboard');
      } else {
        navigation.replace('Dashboard');
      }
    } catch (e) {
      setError(e?.message || 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#ff8a3d', '#f97316', '#7c3aed', '#1e1b4b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              {/* Brand row inside the card */}
              <View style={styles.brandRow}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.brandLogo}
                >
                  <Text style={styles.brandLogoIcon}>⚡</Text>
                </LinearGradient>
                <View style={styles.brandText}>
                  <Text style={styles.brandName}>Innovation Management</Text>
                  <Text style={styles.brandTagline}>Welcome back to your innovation hub</Text>
                </View>
              </View>

              <Text style={styles.formHeading}>Sign in</Text>
              <Text style={styles.formSubheading}>
                Enter your credentials to access your dashboard.
              </Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email address</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>✉</Text>
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
              </View>

              {/* Password */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.formLabel}>Password</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                    accessibilityRole="button"
                    accessibilityLabel="Forgot password"
                  >
                    <Text style={styles.forgotLink}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={[styles.formInput, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
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

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color={colors.white} size="small" />
                      <Text style={styles.submitBtnText}>Signing in...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitBtnText}>Sign In →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footerLinks}>
                <Text style={styles.switchText}>
                  Don't have an account?{' '}
                  <Text
                    style={styles.switchLink}
                    onPress={() => navigation.navigate('Register')}
                  >
                    Create one
                  </Text>
                </Text>

                <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')}>
                  <Text style={styles.adminLinkText}>Admin Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  /* Card */
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },

  /* Brand row */
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandLogoIcon: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  brandText: {
    flex: 1,
  },
  brandName: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  brandTagline: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  /* Form heading */
  formHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  formSubheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },

  /* Error */
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },

  /* Form */
  formGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 10,
  },
  formInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: 'transparent',
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  eyeIcon: {
    fontSize: 18,
  },
  forgotLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },

  /* Submit */
  submitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },

  /* Footer */
  footerLinks: {
    marginTop: 24,
  },
  switchText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '700',
  },
  adminLinkText: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});