import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../../styles/colors';
import { clubStyles } from '../../styles/clubStyles';
import { useApp } from '../../context/AppContext';
import Sidebar from '../../components/Sidebar';

// ClubMembershipScreen
// --------------------
// Three responsibilities:
//   1. Show the user's current membership status (none / pending / active).
//   2. Let them edit their club profile (bio, skills).
//   3. Provide a path forward:
//        - 'none'     → "Join the club" → ClubRegistration
//        - 'pending'  → status info + "Open club dashboard"
//        - 'active'   → "Open club dashboard" + "Apply for leadership"
//
// The status pill is rendered by the shared clubStyles so the Sidebar
// and any future membership card look the same.

const STATUS_LABELS = {
  none: 'Not a member',
  pending: 'Pending verification',
  active: 'Active member',
};

const STATUS_DESCRIPTIONS = {
  none:
    "You haven't joined the club yet. Joining takes a minute — we'll verify your student registration number with your university.",
  pending:
    "We've received your application. Verification usually takes 1–2 business days. You can already browse activities.",
  active:
    'Welcome aboard! You can now participate in all activities, run for leadership, and apply to opportunities with your club projects.',
};

export default function ClubMembershipScreen({ navigation }) {
  const { user, updateClubProfile, verifyMembership } = useApp();

  const [bio, setBio] = useState(user.clubProfile?.bio || '');
  const [skills, setSkills] = useState((user.clubProfile?.skills || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('clubMembership');

  const status = user.membershipStatus;
  const statusKey = STATUS_LABELS[status] ? status : 'none';

  const handleSave = () => {
    setSaving(true);
    // Skills come back as a comma-separated string from the input.
    const cleaned = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setTimeout(() => {
      updateClubProfile({ bio, skills: cleaned });
      setSaving(false);
      Alert.alert('Saved', 'Your club profile has been updated.');
    }, 500);
  };

  // Demo-only shortcut: lets you flip the user to 'active' to test the
  // downstream screens without needing an admin dashboard yet.
  const handleSimulateVerify = () => {
    verifyMembership();
  };

  const pillPalette = {
    active: { bg: clubStyles.statusActive, text: clubStyles.statusActiveText },
    pending: { bg: clubStyles.statusPending, text: clubStyles.statusPendingText },
    none: { bg: clubStyles.statusNone, text: clubStyles.statusNoneText },
  }[statusKey];

  return (
    <SafeAreaView style={styles.container}>
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType="clubMember"
        />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top bar — matches the existing dashboard pattern */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setSidebarOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.pageTitle}>Club Membership</Text>
            <Text style={styles.pageSubtitle}>
              {user.firstName} {user.lastName}
            </Text>
          </View>
          <View style={styles.topBarRight} />
        </View>

        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>Membership</Text>
              <Text style={styles.statusSubtitle}>
                {user.universityName || 'No university selected yet'}
              </Text>
            </View>
            <View style={[clubStyles.statusPill, pillPalette.bg]}>
              <View style={[clubStyles.statusPillDot, { backgroundColor: pillPalette.text.color }]} />
              <Text style={[clubStyles.statusPillText, pillPalette.text]}>
                {STATUS_LABELS[statusKey]}
              </Text>
            </View>
          </View>

          <Text style={styles.statusBody}>{STATUS_DESCRIPTIONS[statusKey]}</Text>

          {user.regNumber ? (
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Registration no.</Text>
              <Text style={styles.kvValue}>{user.regNumber}</Text>
            </View>
          ) : null}

          {user.clubProfile?.joinedAt ? (
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Applied on</Text>
              <Text style={styles.kvValue}>
                {new Date(user.clubProfile.joinedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          ) : null}

          {/* Action row */}
          <View style={styles.actionRow}>
            {statusKey === 'none' && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('ClubRegistration')}
              >
                <Text style={styles.primaryBtnText}>Join the club</Text>
              </TouchableOpacity>
            )}

            {(statusKey === 'pending' || statusKey === 'active') && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('ClubDashboard')}
              >
                <Text style={styles.primaryBtnText}>Open club dashboard</Text>
              </TouchableOpacity>
            )}

            {statusKey === 'pending' && (
              <TouchableOpacity style={styles.ghostBtn} onPress={handleSimulateVerify}>
                <Text style={styles.ghostBtnText}>Simulate admin approval</Text>
              </TouchableOpacity>
            )}

            {statusKey === 'active' && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate('ApplyLeadership')}
              >
                <Text style={styles.secondaryBtnText}>Apply for leadership</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Editable profile (only meaningful after they've joined) */}
        {statusKey !== 'none' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Club profile</Text>
            <Text style={styles.sectionSubtitle}>
              Visible to other members and the leadership team.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Bio</Text>
              <TextInput
                style={[styles.formInput, styles.textarea]}
                placeholder="Tell us about yourself"
                placeholderTextColor={colors.textMuted}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Skills (comma-separated)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="React, IoT, ML, Public speaking"
                placeholderTextColor={colors.textMuted}
                value={skills}
                onChangeText={setSkills}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.white} size="small" />
                  <Text style={styles.saveBtnText}>Saving…</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Save profile</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 32 },

  /* Top bar — mirrors existing dashboard screens */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  menuIcon: { fontSize: 24, color: colors.textSecondary, marginTop: -2 },
  topBarCenter: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  topBarRight: { width: 40 },

  /* Status card */
  statusCard: {
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  statusTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  statusSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 14 },

  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  kvLabel: { fontSize: 12, color: colors.textSecondary },
  kvValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },

  /* Actions */
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  secondaryBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  secondaryBtnText: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
  ghostBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },

  /* Profile editor */
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  sectionSubtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 14, lineHeight: 18 },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  formInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  textarea: { minHeight: 88, paddingTop: 10 },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
