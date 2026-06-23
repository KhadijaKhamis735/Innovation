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

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sector, setSector] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('innovator');

  const requirements = [
    { text: 'At least 6 characters', met: password.length >= 6 },
    { text: 'Contains a number', met: /\d/.test(password) },
  ];

  const handleRegister = () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill all required fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (role === 'funder') {
        navigation.replace('FunderDashboard');
      } else {
        navigation.replace('Dashboard');
      }
    }, 900);
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
          {/* Brand header — compact, single line */}
          <LinearGradient
            colors={['#1a1a2e', '#2d1f0f', '#1a1a2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandHeader}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('Landing')}
              style={styles.brand}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.brandLogo}
              >
                <Text style={styles.brandLogoIcon}>⚡</Text>
              </LinearGradient>
              <View>
                <Text style={styles.brandName}>Innovation Management</Text>
                <Text style={styles.brandTagline}>Join the innovation ecosystem today</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          {/* Form section */}
          <View style={styles.formSection}>
            <Text style={styles.formHeading}>Create account</Text>
            <Text style={styles.formSubheading}>
              Get started — it's completely free.
            </Text>

            {/* Role toggle */}
            <View style={styles.roleToggle}>
              {[
                { key: 'innovator', label: 'Innovator' },
                { key: 'funder', label: 'Funder' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
                  onPress={() => setRole(r.key)}
                >
                  <Text style={[styles.roleBtnText, role === r.key && styles.roleBtnTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Funder notice */}
            {role === 'funder' && (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  <Text style={styles.noticeStrong}>Note: </Text>
                  Funder accounts require admin approval before you can post funding opportunities.
                </Text>
              </View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* First / Last name */}
            <View style={styles.formRow2}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>First Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="First Name"
                  placeholderTextColor={colors.textMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoComplete="given-name"
                />
              </View>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Last Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Last Name"
                  placeholderTextColor={colors.textMuted}
                  value={lastName}
                  onChangeText={setLastName}
                  autoComplete="family-name"
                />
              </View>
            </View>

            {/* Industry / sector (funder only) */}
            {role === 'funder' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Industry / Sector</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Technology, Healthcare"
                  placeholderTextColor={colors.textMuted}
                  value={sector}
                  onChangeText={setSector}
                />
              </View>
            )}

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email address *</Text>
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

            {/* Password / Confirm */}
            <View style={styles.formRow2}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Password *</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.formInput, styles.passwordInput]}
                    placeholder="Create password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {password.length > 0 && (
                  <View style={styles.requirements}>
                    {requirements.map((req, i) => (
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
              </View>

              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Confirm *</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.formInput, styles.passwordInput]}
                    placeholder="Confirm password"
                    placeholderTextColor={colors.textMuted}
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry={!showConfirm}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirm(!showConfirm)}
                  >
                    <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.white} size="small" />
                  <Text style={styles.submitBtnText}>Creating account...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>
                  Register as {role === 'innovator' ? 'Innovator' : 'Funder'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text
                style={styles.switchLink}
                onPress={() => navigation.navigate('Login')}
              >
                Sign in
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  /* Brand header — compact, single line */
  brandHeader: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandLogoIcon: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  brandName: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  brandTagline: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
  },

  /* Form section */
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

  /* Role toggle */
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 2,
  },
  roleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleBtnTextActive: {
    color: colors.white,
  },

  /* Funder notice */
  notice: {
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 19,
  },
  noticeStrong: {
    color: colors.primaryDark,
    fontWeight: '700',
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
  formRow2: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    marginBottom: 18,
  },
  formGroupHalf: {
    flex: 1,
  },
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
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    width: '100%',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  eyeIcon: {
    fontSize: 18,
  },

  /* Password requirements */
  requirements: {
    marginTop: 10,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  requirementIconMet: {
    backgroundColor: '#22c55e',
  },
  requirementIconText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  requirementIconTextMet: {
    color: colors.white,
  },
  requirementText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  requirementTextMet: {
    color: '#22c55e',
    fontWeight: '500',
  },

  /* Submit */
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
  submitBtnDisabled: {
    opacity: 0.65,
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

  /* Switch */
  switchText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 24,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});