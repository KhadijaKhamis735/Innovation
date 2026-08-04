import React, { useEffect, useState } from 'react';
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
import { clubAuthApi } from '../api/clubAuth';
import RoleDropdown from '../components/RoleDropdown';
import UniversityPicker from '../components/UniversityPicker';
import CategoryPicker from '../components/CategoryPicker';

// RegisterScreen
// --------------
// One unified registration surface for all four roles:
//
//   innovator / funder → POST /api/mobile/auth/register
//   club_member / club_leader → POST /api/mobile/club/auth/register
//
// The role picker at the top drives which fields appear below and
// which endpoint gets called on submit. The user never sees the
// branch — same form, same screen, same UX.
//
// Innovation/funder share the existing `signUp()` helper from
// AuthContext (which discards tokens — we deliberately do not
// auto-login after register). Club uses a sibling helper that hits
// the /api/mobile/club/auth/register endpoint and likewise discards
// the response tokens; the user lands on CheckEmail with
// purpose='verify-club' so the resend button hits the right URL.
//
// First/Last name fields stay unified across roles (matches the web
// AuthPage register tab). For club roles we combine them into a
// single `fullName` on the wire, since ClubRegisterRequest requires
// that field.

const ROLE_OPTIONS = ['innovator', 'funder', 'club_member', 'club_leader'];

export default function RegisterScreen({ navigation, route }) {
  const { signUp } = useAuth();

  const [role, setRole] = useState(initialRole(route?.params?.role));
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [organization, setOrganization] = useState('');

  // Club-only state
  const [universities, setUniversities] = useState([]);
  const [universityId, setUniversityId] = useState(null);
  const [category, setCategory] = useState(null);
  const [regNumber, setRegNumber] = useState('');
  const [staffId, setStaffId] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationRole, setOrganizationRole] = useState('');
  const [bio, setBio] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [universitiesError, setUniversitiesError] = useState('');

  const isClubRole = role === 'club_member' || role === 'club_leader';

  // Load universities once when the screen mounts; we only need them
  // when a club role is picked but it's cheap to fetch up front.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await clubAuthApi.listUniversities();
        if (!cancelled) {
          setUniversities(list || []);
          setUniversitiesError('');
        }
      } catch (e) {
        if (!cancelled) {
          setUniversitiesError(
            e?.message || 'Could not load universities. Please retry.',
          );
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const requirements = [
    { text: 'At least 6 characters', met: password.length >= 6 },
    { text: 'Contains a number', met: /\d/.test(password) },
  ];

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill all required fields.');
      return;
    }
    if (role === 'funder' && !organization.trim()) {
      setError('Please enter your organization name.');
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
    if (isClubRole) {
      if (!universityId) {
        setError('Please select your university.');
        return;
      }
      if (!category) {
        setError('Please pick a member category.');
        return;
      }
      if (category === 'student' && !regNumber.trim()) {
        setError('Student registration number is required.');
        return;
      }
      if (category === 'staff' && !staffId.trim()) {
        setError('Staff ID is required.');
        return;
      }
      if (category === 'alumni' && !graduationYear.trim()) {
        setError('Graduation year is required.');
        return;
      }
      if (category === 'corporate') {
        if (!organizationName.trim() || !organizationRole.trim()) {
          setError('Organization name and role are required.');
          return;
        }
      }
    }

    setError('');
    setLoading(true);
    try {
      if (isClubRole) {
        // Club — POST /api/mobile/club/auth/register. Tokens from the
        // response are discarded deliberately (signUp discards them);
        // user lands on CheckEmail with purpose='verify-club'.
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const payload = {
          email: email.trim(),
          password,
          fullName,
          universityId,
          category,
        };
        if (regNumber.trim()) payload.regNumber = regNumber.trim().toUpperCase();
        if (staffId.trim()) payload.staffId = staffId.trim();
        if (graduationYear.trim()) {
          const n = parseInt(graduationYear, 10);
          if (Number.isFinite(n)) payload.graduationYear = n;
        }
        if (organizationName.trim()) payload.organizationName = organizationName.trim();
        if (organizationRole.trim()) payload.organizationRole = organizationRole.trim();
        if (bio.trim()) payload.bio = bio.trim();

        await clubAuthApi.register(payload);
        navigation.replace('CheckEmail', {
          email: email.trim(),
          purpose: 'verify-club',
        });
        return;
      }

      // Innovator / funder — POST /api/mobile/auth/register via the
      // existing signUp() helper. The funder's organization lives on
      // the `sector` column server-side (deferred rename).
      const payload = {
        email: email.trim(),
        password,
        role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      if (role === 'funder') payload.sector = organization.trim();

      await signUp(payload);
      navigation.replace('CheckEmail', {
        email: email.trim(),
        purpose: 'verify',
      });
    } catch (e) {
      setError(e?.message || 'Could not create your account. Please try again.');
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
              {/* Brand row */}
              <View style={styles.brandRow}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.brandLogo}
                >
                  <Text style={styles.brandLogoIcon}>⚡</Text>
                </LinearGradient>
                <View style={styles.brandText}>
                  <Text style={styles.brandName}>Innovation Management</Text>
                  <Text style={styles.brandTagline}>
                    Join the innovation ecosystem today
                  </Text>
                </View>
              </View>

              <Text style={styles.formHeading}>Create account</Text>
              <Text style={styles.formSubheading}>
                {isClubRole
                  ? "Pick your role and add your university details — we'll get you in."
                  : "Get started — it's completely free."}
              </Text>

              {isClubRole ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>
                    <Text style={styles.noticeStrong}>Heads up: </Text>
                    {role === 'club_leader'
                      ? 'Club leader accounts are normally created by an administrator. Selecting this option creates a member account that can later be promoted.'
                      : 'Your membership enters "pending" until a club leader verifies your registration.'}
                  </Text>
                </View>
              ) : null}

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

              {/* Role dropdown — the heart of the unified form */}
              <RoleDropdown value={role} onChange={setRole} />

              {/* Funder-only: organization name */}
              {role === 'funder' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Organization name *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Acme Foundation"
                    placeholderTextColor={colors.textMuted}
                    value={organization}
                    onChangeText={setOrganization}
                    autoComplete="organization"
                  />
                </View>
              )}

              {/* Club-only: university + category + category-conditional fields */}
              {isClubRole && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>University *</Text>
                    {universitiesError ? (
                      <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{universitiesError}</Text>
                      </View>
                    ) : (
                      <UniversityPicker
                        universities={universities}
                        value={universityId}
                        onChange={setUniversityId}
                      />
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Member category *</Text>
                    <CategoryPicker value={category} onChange={setCategory} />
                  </View>

                  {category === 'student' && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Student registration number *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. SUZA/2024/001"
                        placeholderTextColor={colors.textMuted}
                        value={regNumber}
                        onChangeText={(t) => setRegNumber(t.toUpperCase())}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                      <Text style={styles.helperText}>
                        Appears on your student ID and is checked against the university registry.
                      </Text>
                    </View>
                  )}

                  {category === 'staff' && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Staff ID *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. SUZA-STF-2034"
                        placeholderTextColor={colors.textMuted}
                        value={staffId}
                        onChangeText={setStaffId}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                    </View>
                  )}

                  {category === 'alumni' && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Graduation year *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. 2022"
                        placeholderTextColor={colors.textMuted}
                        value={graduationYear}
                        onChangeText={setGraduationYear}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                  )}

                  {category === 'corporate' && (
                    <>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Organization name *</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="e.g. BlueWave Tech"
                          placeholderTextColor={colors.textMuted}
                          value={organizationName}
                          onChangeText={setOrganizationName}
                          autoComplete="organization"
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Your role *</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="e.g. Head of Innovation"
                          placeholderTextColor={colors.textMuted}
                          value={organizationRole}
                          onChangeText={setOrganizationRole}
                        />
                      </View>
                    </>
                  )}

                  {/* Bio — optional, all categories */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Short bio (optional)</Text>
                    <TextInput
                      style={[styles.formInput, styles.textarea]}
                      placeholder="What do you build? What are you hoping to learn from the club?"
                      placeholderTextColor={colors.textMuted}
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </>
              )}

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
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
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
                      accessibilityRole="button"
                      accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}
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
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color={colors.white} size="small" />
                      <Text style={styles.submitBtnText}>Creating account…</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitBtnText}>Create account →</Text>
                  )}
                </LinearGradient>
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
    </LinearGradient>
  );
}

// Pull `route.params?.role` into the initial dropdown value. Falls
// back to 'innovator' so the field has a sane default if nothing
// was passed (e.g. opening Register from the CTA on Landing).
function initialRole(param) {
  return ROLE_OPTIONS.includes(param) ? param : 'innovator';
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },

  /* Card */
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
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
    marginBottom: 20,
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
  brandText: { flex: 1 },
  brandName: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  brandTagline: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  /* Form heading */
  formHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  formSubheading: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 19,
  },

  /* Notice */
  notice: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 12,
    color: '#5b21b6',
    lineHeight: 18,
  },
  noticeStrong: {
    color: '#4c1d95',
    fontWeight: '700',
  },

  /* Error */
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },

  /* Form */
  formRow2: {
    flexDirection: 'row',
    gap: 10,
  },
  formGroup: {
    marginBottom: 16,
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
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    width: '100%',
  },
  textarea: {
    minHeight: 90,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },

  /* Password requirements */
  requirements: {
    marginTop: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
    fontSize: 10,
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
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
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

  /* Switch */
  switchText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 22,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});