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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../styles/colors';
import { useApp } from '../../context/AppContext';

// ApplyLeadershipScreen
// ---------------------
// Application form for an open leadership position.
// Receives optional { positionId } via route params (set when launched
// from a position card on ClubLeadershipScreen). If no positionId is
// provided, the user picks from a dropdown.
//
// Submit calls applyForLeadership() in context, which appends a record
// with status 'pending'. A confirmation alert returns the user to the
// leadership screen.

export default function ApplyLeadershipScreen({ navigation, route }) {
  const { openPositions, leadershipApps, applyForLeadership, user } = useApp();
  const initialPositionId = route?.params?.positionId || openPositions[0]?.id || null;

  const [positionId, setPositionId] = useState(initialPositionId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [statement, setStatement] = useState('');
  const [experience, setExperience] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selected = openPositions.find((p) => p.id === positionId);

  // Guard: if a user already applied for this exact position we surface
  // it instead of letting them double-submit.
  const alreadyApplied = leadershipApps.some(
    (a) => a.userId === user.id && a.positionId === positionId,
  );

  const handleSubmit = () => {
    if (!positionId) {
      setError('Choose a position to apply for.');
      return;
    }
    if (statement.trim().length < 40) {
      setError('Tell us a bit more — at least 40 characters in your statement.');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      applyForLeadership({
        positionId,
        positionTitle: selected?.title,
        applicantName: `${user.firstName} ${user.lastName}`.trim(),
        statement: statement.trim(),
        experience: experience.trim(),
        hoursPerWeek: hoursPerWeek ? Number(hoursPerWeek) : null,
      });
      setLoading(false);
      Alert.alert(
        'Application submitted',
        'Leadership will review your application and get back to you within a week.',
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    }, 700);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.pageTitle}>Apply for Leadership</Text>
          </View>
          <View style={styles.topBarRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={['#0a1f3c', '#0e4d8c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroTitle}>Lead the club 🎯</Text>
            <Text style={styles.heroSubtitle}>
              Leadership applications are reviewed by the current officers.
              Be specific about what you'd do in the role.
            </Text>
          </LinearGradient>

          {/* Position picker */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Position *</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setPickerOpen((v) => !v)}
              activeOpacity={0.8}
            >
              {selected ? (
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerName}>{selected.title}</Text>
                  <Text style={styles.pickerShort} numberOfLines={1}>{selected.description}</Text>
                </View>
              ) : (
                <Text style={styles.pickerPlaceholder}>Choose a position</Text>
              )}
              <Text style={styles.pickerChevron}>{pickerOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {pickerOpen && (
              <View style={styles.pickerDropdown}>
                {openPositions.map((p) => {
                  const isSelected = p.id === positionId;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                      onPress={() => {
                        setPositionId(p.id);
                        setPickerOpen(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerItemName, isSelected && styles.pickerItemNameActive]}>
                          {p.title}
                        </Text>
                        <Text style={styles.pickerItemShort}>{p.description}</Text>
                      </View>
                      {isSelected && <Text style={styles.pickerCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Statement */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Why do you want this role? *</Text>
            <TextInput
              style={[styles.formInput, styles.textarea]}
              placeholder="What would you do in the first 90 days? What's your motivation?"
              placeholderTextColor={colors.textMuted}
              value={statement}
              onChangeText={setStatement}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>{statement.length} characters</Text>
          </View>

          {/* Experience */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Relevant experience</Text>
            <TextInput
              style={[styles.formInput, styles.textarea]}
              placeholder="Past roles, projects, or anything that demonstrates fit."
              placeholderTextColor={colors.textMuted}
              value={experience}
              onChangeText={setExperience}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Hours per week */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Hours per week you can commit</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 6"
              placeholderTextColor={colors.textMuted}
              value={hoursPerWeek}
              onChangeText={setHoursPerWeek}
              keyboardType="numeric"
            />
          </View>

          {alreadyApplied && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                You've already applied for this position. The leadership team will reach out by email.
              </Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, (loading || alreadyApplied) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading || alreadyApplied}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.white} size="small" />
                <Text style={styles.submitBtnText}>Submitting…</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>
                {alreadyApplied ? 'Already submitted' : 'Submit application'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  backIcon: { fontSize: 24, color: colors.textSecondary, marginTop: -2 },
  topBarCenter: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  topBarRight: { width: 40 },

  body: { padding: 16, paddingBottom: 40 },

  hero: { borderRadius: 16, padding: 18, marginBottom: 18 },
  heroTitle: { color: colors.white, fontSize: 18, fontWeight: '800' },
  heroSubtitle: { color: '#cbd5e1', fontSize: 12, marginTop: 6, lineHeight: 18 },

  formGroup: { marginBottom: 18 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  formInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 14, color: colors.textPrimary, backgroundColor: colors.white,
  },
  textarea: { minHeight: 110, paddingTop: 12 },
  helperText: { fontSize: 11, color: colors.textMuted, marginTop: 6 },

  /* Picker */
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.white, gap: 8,
  },
  pickerName: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  pickerShort: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  pickerPlaceholder: { color: colors.textMuted, fontSize: 14 },
  pickerChevron: { color: colors.textMuted, fontSize: 12 },
  pickerDropdown: {
    marginTop: 8, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, backgroundColor: colors.white, overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8,
  },
  pickerItemActive: { backgroundColor: colors.primaryLight },
  pickerItemName: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  pickerItemNameActive: { color: colors.primaryDark, fontWeight: '700' },
  pickerItemShort: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  pickerCheck: { color: colors.primary, fontSize: 16, fontWeight: '700' },

  /* Notice + error */
  notice: {
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.2)',
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  noticeText: { fontSize: 13, color: '#92400e', lineHeight: 19 },
  errorBox: {
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  errorText: { color: '#dc2626', fontSize: 13 },

  submitBtn: {
    backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 3,
  },
  submitBtnDisabled: { opacity: 0.65 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});