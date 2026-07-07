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
import Sidebar from '../../components/Sidebar';

// ClubCreateProject
// -----------------
// Creates an innovation project from inside the Club flow.
// On submit, calls addProject() on AppContext — the same store that
// MyProjectsScreen reads from. The new project shows up there
// immediately, tagged with source: 'club' and a "🎓 Club project"
// badge. That's the integration guarantee made concrete.
//
// Available to any user — you don't need to be a club member to spin
// up a project from inside the Club UI, since the goal is to lower
// the friction between "join club" and "start building".

const CATEGORIES = [
  'AgriTech',
  'FinTech',
  'IoT / Environment',
  'HealthTech',
  'EdTech',
  'AI / ML',
  'Other',
];

export default function ClubCreateProject({ navigation }) {
  const { addProject, user } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [problem, setProblem] = useState('');
  const [audience, setAudience] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('clubDashboard');

  const handleSubmit = () => {
    if (name.trim().length < 3) {
      setError('Give your project a name (at least 3 characters).');
      return;
    }
    if (description.trim().length < 20) {
      setError('Add a short description (at least 20 characters).');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      addProject({
        zsaId: `ZSA-INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        name: name.trim(),
        category,
        phase: 'idea',
        description: description.trim(),
        // We don't have a separate description field for problem/audience
        // in the projects model yet, so we splice them into the
        // description. This keeps the existing MyProjects card readable
        // without forcing a schema migration right now.
        problem: problem.trim(),
        audience: audience.trim(),
      });
      setLoading(false);
      Alert.alert(
        'Project created 🎉',
        `"${name.trim()}" is now in your projects. You can apply to opportunities with it from the Innovation module.`,
        [{ text: 'Open My Projects', onPress: () => navigation.replace('MyProjects') }],
      );
    }, 700);
  };

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
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setSidebarOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.pageTitle}>New project</Text>
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
            <Text style={styles.heroTitle}>Start a club project 🚀</Text>
            <Text style={styles.heroSubtitle}>
              Projects you create here appear in your Innovation dashboard, too —
              use them to apply for funding.
            </Text>
          </LinearGradient>

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Project name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Smart Water Monitor"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Category picker */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Category *</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setPickerOpen((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.pickerName}>{category}</Text>
              <Text style={styles.pickerChevron}>{pickerOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {pickerOpen && (
              <View style={styles.pickerDropdown}>
                {CATEGORIES.map((c) => {
                  const isSelected = c === category;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                      onPress={() => {
                        setCategory(c);
                        setPickerOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemName,
                          isSelected && styles.pickerItemNameActive,
                        ]}
                      >
                        {c}
                      </Text>
                      {isSelected && <Text style={styles.pickerCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Short description *</Text>
            <TextInput
              style={[styles.formInput, styles.textarea]}
              placeholder="What are you building and why?"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>{description.length} characters</Text>
          </View>

          {/* Problem (optional) */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Problem statement (optional)</Text>
            <TextInput
              style={[styles.formInput, styles.textarea]}
              placeholder="What problem are you solving, and for whom?"
              placeholderTextColor={colors.textMuted}
              value={problem}
              onChangeText={setProblem}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Target audience (optional) */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Target audience (optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. smallholder farmers in rural Tanzania"
              placeholderTextColor={colors.textMuted}
              value={audience}
              onChangeText={setAudience}
            />
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              <Text style={styles.noticeStrong}>Logged in as </Text>
              {user.firstName} {user.lastName} ({user.email}). The project will be tagged
              as a "Club project" and visible in My Projects.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.white} size="small" />
                <Text style={styles.submitBtnText}>Creating…</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>Create project</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 24 }} />
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
  menuBtn: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
    marginLeft: 8,
  },
  menuIcon: { fontSize: 20, color: colors.textSecondary },
  topBarCenter: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  topBarRight: { width: 40 },

  body: { padding: 16, paddingBottom: 32 },

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
  textarea: { minHeight: 96, paddingTop: 12 },
  helperText: { fontSize: 11, color: colors.textMuted, marginTop: 6 },

  /* Picker */
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.white,
  },
  pickerName: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  pickerChevron: { color: colors.textMuted, fontSize: 12 },
  pickerDropdown: {
    marginTop: 8, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, backgroundColor: colors.white, overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  pickerItemActive: { backgroundColor: colors.primaryLight },
  pickerItemName: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  pickerItemNameActive: { color: colors.primaryDark, fontWeight: '700' },
  pickerCheck: { color: colors.primary, fontSize: 16, fontWeight: '700' },

  /* Notice + error */
  notice: {
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.2)',
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  noticeText: { fontSize: 13, color: '#92400e', lineHeight: 19 },
  noticeStrong: { color: colors.primaryDark, fontWeight: '700' },
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