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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../styles/colors';
import { universities } from '../../context/data/universities';
import { useApp } from '../../context/AppContext';

// ClubRegistrationScreen
// -----------------------
// First step of the club flow. Collects:
//   - University (from a search list)
//   - Student registration number
//   - Optional short bio
// On submit, calls joinClub() from AppContext, which stamps
// membershipStatus='pending' and grants the 'clubMember' role.
// Navigation lands the user on ClubMembershipScreen so they can
// see the new "pending" status immediately.

export default function ClubRegistrationScreen({ navigation }) {
  const { user, joinClub } = useApp();

  const [universityId, setUniversityId] = useState(user.universityId || null);
  const [regNumber, setRegNumber] = useState(user.regNumber || '');
  const [bio, setBio] = useState(user.clubProfile?.bio || '');
  const [search, setSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedUniversity = useMemo(
    () => universities.find((u) => u.id === universityId) || null,
    [universityId],
  );

  const filteredUniversities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter(
      (u) => u.name.toLowerCase().includes(q) || u.shortName.toLowerCase().includes(q),
    );
  }, [search]);

  const regNumberValid = /^[A-Za-z0-9/-]{4,20}$/.test(regNumber.trim());

  const handleSubmit = () => {
    if (!universityId) {
      setError('Please select your university.');
      return;
    }
    if (!regNumberValid) {
      setError('Enter a valid registration number (4–20 letters/digits).');
      return;
    }
    setError('');
    setLoading(true);

    // Simulated network call. The context update is synchronous, but we
    // mimic latency so the user sees the loading state and trusts the
    // pending status when it lands.
    setTimeout(() => {
      joinClub({
        universityId,
        universityName: selectedUniversity.name,
        regNumber: regNumber.trim().toUpperCase(),
      });
      setLoading(false);
      Alert.alert(
        'Application submitted',
        'Your club membership is now pending verification. You can browse the club while you wait.',
        [
          {
            text: 'View status',
            onPress: () => navigation.replace('ClubMembership'),
          },
        ],
      );
    }, 800);
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
          {/* Brand header — matches the existing screens */}
          <LinearGradient
            colors={['#0a1f3c', '#0e4d8c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandHeader}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('Dashboard')}
              style={styles.brand}
            >
              <View style={styles.brandLogo}>
                <Text style={styles.brandLogoIcon}>🎓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brandName}>Join the Club</Text>
                <Text style={styles.brandTagline}>
                  Connect, build, and apply for opportunities together
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          {/* Form section */}
          <View style={styles.formSection}>
            <Text style={styles.formHeading}>Club registration</Text>
            <Text style={styles.formSubheading}>
              You're joining as <Text style={styles.bold}>{user.firstName}</Text> ({user.email}).
              We need a few details to verify your student status.
            </Text>

            {/* University picker */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>University *</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setPickerOpen((v) => !v)}
                activeOpacity={0.8}
              >
                {selectedUniversity ? (
                  <View>
                    <Text style={styles.pickerName}>{selectedUniversity.name}</Text>
                    <Text style={styles.pickerShort}>{selectedUniversity.shortName}</Text>
                  </View>
                ) : (
                  <Text style={styles.pickerPlaceholder}>Select your university</Text>
                )}
                <Text style={styles.pickerChevron}>{pickerOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {pickerOpen && (
                <View style={styles.pickerDropdown}>
                  <View style={styles.pickerSearchWrap}>
                    <TextInput
                      style={styles.pickerSearch}
                      placeholder="Search universities…"
                      placeholderTextColor={colors.textMuted}
                      value={search}
                      onChangeText={setSearch}
                      autoCorrect={false}
                    />
                  </View>
                  {filteredUniversities.length === 0 ? (
                    <Text style={styles.pickerEmpty}>No matches.</Text>
                  ) : (
                    filteredUniversities.map((u) => {
                      const isSelected = u.id === universityId;
                      return (
                        <TouchableOpacity
                          key={u.id}
                          style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                          onPress={() => {
                            setUniversityId(u.id);
                            setPickerOpen(false);
                            setSearch('');
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.pickerItemName,
                                isSelected && styles.pickerItemNameActive,
                              ]}
                            >
                              {u.name}
                            </Text>
                            <Text style={styles.pickerItemShort}>{u.shortName}</Text>
                          </View>
                          {isSelected && <Text style={styles.pickerCheck}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>

            {/* Registration number */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Student registration number *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. BU/2023/081"
                placeholderTextColor={colors.textMuted}
                value={regNumber}
                onChangeText={setRegNumber}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={styles.helperText}>
                This appears on your student ID and is checked against the university registry.
              </Text>
            </View>

            {/* Optional bio */}
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

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Notice */}
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                <Text style={styles.noticeStrong}>What happens next: </Text>
                Your application enters <Text style={styles.noticeStrong}>pending verification</Text>.
                Once an admin confirms your registration number, your status becomes{' '}
                <Text style={styles.noticeStrong}>active</Text> and you can apply to leadership.
              </Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.white} size="small" />
                  <Text style={styles.submitBtnText}>Submitting…</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>Submit application</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.switchText}>
              Already a member?{' '}
              <Text
                style={styles.switchLink}
                onPress={() => navigation.navigate('ClubMembership')}
              >
                View membership status
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

  /* Brand header */
  brandHeader: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoIcon: { color: colors.white, fontSize: 22, fontWeight: '700' },
  brandName: { color: colors.white, fontWeight: '700', fontSize: 16 },
  brandTagline: { color: '#cbd5e1', fontSize: 12, marginTop: 2 },

  /* Form */
  formSection: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  formHeading: {
    fontSize: 26,
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
  bold: { fontWeight: '700', color: colors.textPrimary },

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
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    width: '100%',
  },
  textarea: { minHeight: 96, paddingTop: 12 },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },

  /* Picker */
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  pickerPlaceholder: { color: colors.textMuted, fontSize: 14 },
  pickerName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  pickerShort: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  pickerChevron: { color: colors.textMuted, fontSize: 12 },
  pickerDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  pickerSearchWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 10,
  },
  pickerSearch: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.textPrimary,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemActive: { backgroundColor: colors.primaryLight },
  pickerItemName: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  pickerItemNameActive: { color: colors.primaryDark, fontWeight: '700' },
  pickerItemShort: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  pickerCheck: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  pickerEmpty: {
    padding: 14,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },

  /* Notice + error */
  notice: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  noticeText: { fontSize: 13, color: '#1d4ed8', lineHeight: 19 },
  noticeStrong: { color: '#1e3a8a', fontWeight: '700' },

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
