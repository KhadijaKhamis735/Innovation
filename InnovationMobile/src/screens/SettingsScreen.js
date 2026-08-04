import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { usersApi, classifyProfileError } from '../api/users';

export default function SettingsScreen({ navigation }) {
  const { user, setUser, role } = useAuth();

  // Sidebar gating — the Settings screen is reachable from both Innovator
  // and Funder Sidebars. We default to 'innovator' so Sidebar renders the
  // right menu even when the Funder menu would otherwise ghost.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('settings');

  // Profile form state. Initialised from the live `user` (from AuthContext)
  // and re-initialised whenever the parent screen regains focus so the
  // form reflects any server-side changes the user made elsewhere.
  const [form, setForm] = useState(() => userToForm(user));
  const [notifications, setNotifications] = useState(() => userToNotifications(user));

  // Loading + error surfaces.
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  // Mounted guard — prevents state writes after the user leaves the screen.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // ── Reload on focus so the form never displays stale data. ─────
  const reload = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    setError(null);
    try {
      // Local form is the source of truth while the screen is mounted;
      // refreshing here just re-syncs local state and clears the spinner.
      if (mountedRef.current) {
        setForm(userToForm(user));
        setNotifications(userToNotifications(user));
      }
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => {
    // Any time the screen regains focus, sync the form with the latest
    // user from AuthContext (e.g. after the user changed their name on
    // web, or after a /me refresh).
    if (mountedRef.current) {
      setForm(userToForm(user));
      setNotifications(userToNotifications(user));
    }
  }, [user]));

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      const patch = buildPatch(form, notifications);
      if (Object.keys(patch).length === 0) {
        // Nothing actually changed — keep the UX snappy, no round-trip.
        setSavedAt(Date.now());
        return;
      }
      const updated = await usersApi.updateMe(patch);
      if (!mountedRef.current) return;
      // Update AuthContext so the sidebar name + initials refresh too.
      setUser(updated);
      setForm(userToForm(updated));
      setNotifications(userToNotifications(updated));
      setSavedAt(Date.now());
    } catch (err) {
      if (!mountedRef.current) return;
      const c = classifyProfileError(err);
      if (c.kind === 'unauthorized') {
        // The client's single-flight refresh will already have run; if
        // we're still here, the session is dead.
        Alert.alert('Session expired', 'Please sign in again.');
        return;
      }
      setError(c.message || 'Could not save changes.');
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────
  const sidebarUserType = role === 'funder' ? 'funder' : 'innovator';

  return (
    <SafeAreaView style={styles.container}>
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType={sidebarUserType}
        />
      )}

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle}>Settings</Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reload} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {!loading && (
          <View style={styles.settingsContainer}>
            {/* Profile */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile information</Text>
              <Text style={styles.sectionSubtitle}>
                Update your personal details.
              </Text>

              <View style={styles.card}>
                <Field
                  label="First name"
                  value={form.firstName}
                  onChange={(v) => setForm({ ...form, firstName: v })}
                  editable={!saving}
                />
                <Field
                  label="Last name"
                  value={form.lastName}
                  onChange={(v) => setForm({ ...form, lastName: v })}
                  editable={!saving}
                />
                <Field
                  label="Email"
                  value={user?.email || ''}
                  editable={false}
                  hint="Email is verified by the platform and cannot be changed here."
                />
                <Field
                  label="Phone"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  keyboardType="phone-pad"
                  editable={!saving}
                />
                <Field
                  label="Location"
                  value={form.location}
                  onChange={(v) => setForm({ ...form, location: v })}
                  editable={!saving}
                />
                <View>
                  <Text style={styles.fieldLabel}>Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={form.bio}
                    onChangeText={(v) => setForm({ ...form, bio: v })}
                    multiline
                    numberOfLines={4}
                    placeholder="Tell people about your work"
                    placeholderTextColor={colors.textMuted}
                    editable={!saving}
                  />
                </View>
              </View>
            </View>

            {/* Notifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification preferences</Text>
              <Text style={styles.sectionSubtitle}>
                Choose how you want to be notified.
              </Text>

              <View style={styles.card}>
                <Text style={styles.toggleGroupTitle}>Email</Text>
                <Toggle
                  label="Application updates"
                  description="When your application stage changes"
                  value={notifications.emailApplications}
                  onValueChange={(v) =>
                    setNotifications({ ...notifications, emailApplications: v })
                  }
                  disabled={saving}
                />
                <Toggle
                  label="Project updates"
                  description="Updates about your active projects"
                  value={notifications.emailUpdates}
                  onValueChange={(v) =>
                    setNotifications({ ...notifications, emailUpdates: v })
                  }
                  disabled={saving}
                />
                <Toggle
                  label="Deadline reminders"
                  description="Reminders about upcoming deadlines"
                  value={notifications.emailReminders}
                  onValueChange={(v) =>
                    setNotifications({ ...notifications, emailReminders: v })
                  }
                  disabled={saving}
                />

                <Text style={[styles.toggleGroupTitle, { marginTop: 16 }]}>Push</Text>
                <Toggle
                  label="Application updates"
                  description="Push notifications for application changes"
                  value={notifications.pushApplications}
                  onValueChange={(v) =>
                    setNotifications({ ...notifications, pushApplications: v })
                  }
                  disabled={saving}
                />
                <Toggle
                  label="Project updates"
                  description="Push notifications for project changes"
                  value={notifications.pushUpdates}
                  onValueChange={(v) =>
                    setNotifications({ ...notifications, pushUpdates: v })
                  }
                  disabled={saving}
                />
                <Toggle
                  label="Deadline reminders"
                  description="Push notifications for deadlines"
                  value={notifications.pushReminders}
                  onValueChange={(v) =>
                    setNotifications({ ...notifications, pushReminders: v })
                  }
                  disabled={saving}
                />
              </View>
            </View>

            {/* Security note — direct password change is deferred per Phase 7.
                Password reset remains the secure path. */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Security</Text>
              <Text style={styles.sectionSubtitle}>
                Manage your password.
              </Text>

              <View style={styles.card}>
                <View style={styles.securityRow}>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.fieldLabel}>Password</Text>
                    <Text style={styles.securityNote}>
                      Use the forgot-password flow to receive a secure reset link.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.securityBtn}
                    onPress={() => navigation.navigate('ForgotPassword')}
                    disabled={saving}
                  >
                    <Text style={styles.securityBtnText}>Change password</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {savedAt && !error && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>Saved ✓</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>Save changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Reusable row components ─────────────────────────────────────

function Field({ label, value, onChange, editable = true, keyboardType, hint, multiline }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled, multiline && styles.textarea]}
        value={value ?? ''}
        onChangeText={onChange}
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function Toggle({ label, description, value, onValueChange, disabled }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flexShrink: 1, paddingRight: 12 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDesc}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
      />
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function userToForm(user) {
  if (!user) {
    return { firstName: '', lastName: '', phone: '', bio: '', location: '' };
  }
  return {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    bio: user.bio || '',
    location: user.location || '',
  };
}

function userToNotifications(user) {
  if (!user) {
    return {
      emailApplications: true,
      emailUpdates: true,
      emailReminders: true,
      pushApplications: false,
      pushUpdates: false,
      pushReminders: false,
    };
  }
  return {
    emailApplications: !!user.emailApplications,
    emailUpdates: !!user.emailUpdates,
    emailReminders: !!user.emailReminders,
    pushApplications: !!user.pushApplications,
    pushUpdates: !!user.pushUpdates,
    pushReminders: !!user.pushReminders,
  };
}

/**
 * Build the PATCH body. Empty / whitespace strings are dropped so the
 * backend doesn't reject them as "blank" for the required fields. Booleans
 * are always included so we send an explicit value.
 */
function buildPatch(form, notifications) {
  const patch = {};
  const firstName = (form.firstName ?? '').trim();
  const lastName = (form.lastName ?? '').trim();
  if (firstName) patch.firstName = firstName;
  if (lastName) patch.lastName = lastName;

  const phone = (form.phone ?? '').trim();
  if (phone) patch.phone = phone;
  const bio = (form.bio ?? '').trim();
  if (bio) patch.bio = bio;
  const location = (form.location ?? '').trim();
  if (location) patch.location = location;

  patch.emailApplications = !!notifications.emailApplications;
  patch.emailUpdates = !!notifications.emailUpdates;
  patch.emailReminders = !!notifications.emailReminders;
  patch.pushApplications = !!notifications.pushApplications;
  patch.pushUpdates = !!notifications.pushUpdates;
  patch.pushReminders = !!notifications.pushReminders;

  return patch;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  center: { paddingVertical: 60, alignItems: 'center' },

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
  menuIcon: { fontSize: 20, color: colors.textSecondary },
  topBarCenter: { flex: 1 },
  pageTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  settingsContainer: { padding: 16, gap: 18 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sectionSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },

  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },

  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  fieldHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  inputDisabled: { backgroundColor: colors.background, color: colors.textMuted },
  textarea: { minHeight: 90, textAlignVertical: 'top' },

  toggleGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  toggleDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  securityNote: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  securityBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  securityBtnText: { color: colors.primary, fontWeight: '600' },

  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: '#991b1b', fontSize: 13 },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  successText: { color: '#166534', fontSize: 13, fontWeight: '600' },

  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
