import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { projectsApi, toCreateBody, classifyProjectError } from '../api/projects';
import {
  PHASE_ORDER,
  PHASE_LABELS,
  phasePalette,
} from '../api/phases';
import { verificationRequired } from '../api/client';

const emptyMilestone = () => ({ name: '', description: '' });

export default function InnovationProjectCreateScreen({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('projects');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    category: '',
    startDate: '',
    phase: 'idea',
    tags: '',
    milestones: [emptyMilestone()],
  });

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateMilestone = (idx, patch) =>
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    }));

  const addMilestoneRow = () =>
    setForm((prev) => ({ ...prev, milestones: [...prev.milestones, emptyMilestone()] }));

  const removeMilestoneRow = (idx) =>
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.length > 1 ? prev.milestones.filter((_, i) => i !== idx) : prev.milestones,
    }));

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const validate = useCallback(() => {
    if (!form.name.trim()) return 'Project name is required.';
    if (form.name.trim().length > 160) return 'Name must be 160 characters or fewer.';
    if (form.tagline && form.tagline.length > 240) return 'Tagline must be 240 characters or fewer.';
    if (form.description && form.description.length > 2000) return 'Description must be 2000 characters or fewer.';
    if (form.category && form.category.length > 120) return 'Category must be 120 characters or fewer.';
    if (!PHASE_ORDER.includes(form.phase)) return 'Pick a valid phase.';
    if (form.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.startDate.trim())) {
      return 'Start date must be YYYY-MM-DD.';
    }
    return null;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const body = toCreateBody(form);
      const created = await projectsApi.create(body);
      showToast('Project created.');
      // Navigate back to the list and pass a refresh signal so it
      // refetches — `useFocusEffect` already handles this anyway.
      setTimeout(() => navigation.navigate('MyProjects', { createdId: created?.id }), 250);
    } catch (e) {
      if (verificationRequired(e)) {
        Alert.alert(
          'Verify your email first',
          'You need to verify your email before creating projects.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Verify now', onPress: () => navigation.navigate('VerifyEmail') },
          ],
        );
      } else {
        const cls = classifyProjectError(e);
        setError(cls.message || 'Could not create the project.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, navigation, submitting, validate]);

  const onCancel = () => navigation.navigate('MyProjects');

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType="innovator"
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
          <Text style={styles.pageTitle}>New Project</Text>
          <Text style={styles.pageSubtitle}>Create a project to start tracking milestones</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basics</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Project name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Smart Water Monitor"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              maxLength={160}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Tagline</Text>
            <TextInput
              style={styles.formInput}
              placeholder="One sentence describing the project"
              placeholderTextColor={colors.textMuted}
              value={form.tagline}
              onChangeText={(v) => updateField('tagline', v)}
              maxLength={240}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea]}
              placeholder="What problem does this solve? Who benefits?"
              placeholderTextColor={colors.textMuted}
              multiline
              value={form.description}
              onChangeText={(v) => updateField('description', v)}
              maxLength={2000}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Category</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. AgriTech"
                placeholderTextColor={colors.textMuted}
                value={form.category}
                onChangeText={(v) => updateField('category', v)}
                maxLength={120}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Start date</Text>
              <TextInput
                style={styles.formInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={form.startDate}
                onChangeText={(v) => updateField('startDate', v)}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Tags (comma-separated)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. iot, water, rural"
              placeholderTextColor={colors.textMuted}
              value={form.tags}
              onChangeText={(v) => updateField('tags', v)}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Phase</Text>
          <View style={styles.phaseGrid}>
            {PHASE_ORDER.map((phaseId) => {
              const palette = phasePalette(phaseId);
              const active = form.phase === phaseId;
              return (
                <TouchableOpacity
                  key={phaseId}
                  style={[
                    styles.phaseChip,
                    active && { borderColor: palette.color, backgroundColor: palette.bg },
                  ]}
                  onPress={() => updateField('phase', phaseId)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.phaseChipText, active && { color: palette.color }]}>
                    {PHASE_LABELS[phaseId]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.helperText}>
            You can advance the phase later from the project detail screen.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Initial milestones</Text>
            <TouchableOpacity onPress={addMilestoneRow} activeOpacity={0.85}>
              <Text style={styles.linkAction}>+ Add milestone</Text>
            </TouchableOpacity>
          </View>
          {form.milestones.map((m, idx) => (
            <View key={idx} style={styles.milestoneCard}>
              <View style={styles.milestoneHeader}>
                <Text style={styles.milestoneIndex}>#{idx + 1}</Text>
                {form.milestones.length > 1 ? (
                  <TouchableOpacity onPress={() => removeMilestoneRow(idx)} activeOpacity={0.7}>
                    <Text style={styles.removeAction}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Problem statement"
                  placeholderTextColor={colors.textMuted}
                  value={m.name}
                  onChangeText={(v) => updateMilestone(idx, { name: v })}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextareaSmall]}
                  placeholder="Optional — what does completing this milestone prove?"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={m.description}
                  onChangeText={(v) => updateMilestone(idx, { description: v })}
                />
              </View>
            </View>
          ))}
          <Text style={styles.helperText}>
            You can also add, edit, and complete milestones from the project detail screen.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={onCancel}
            activeOpacity={0.85}
            disabled={submitting}
          >
            <Text style={styles.btnOutlineText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Create Project ✓</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {!!toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  menuIcon: { fontSize: 20, color: colors.textSecondary },
  topBarCenter: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  bottomPad: { height: 24 },

  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  formInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    color: colors.textPrimary, backgroundColor: colors.white,
  },
  formTextarea: { minHeight: 110, textAlignVertical: 'top' },
  formTextareaSmall: { minHeight: 72, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: 12 },

  phaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  phaseChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  phaseChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  helperText: { fontSize: 11, color: colors.textMuted, marginTop: 8, lineHeight: 16 },

  milestoneCard: {
    backgroundColor: colors.background, borderRadius: 12, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  milestoneHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  milestoneIndex: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  removeAction: { fontSize: 12, fontWeight: '700', color: colors.error },
  linkAction: { fontSize: 12, fontWeight: '700', color: colors.primary },

  errorBox: {
    padding: 12, borderRadius: 10, marginBottom: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  errorText: { color: '#b91c1c', fontSize: 13, lineHeight: 18 },

  actions: {
    flexDirection: 'row', gap: 10, justifyContent: 'flex-end',
    paddingTop: 6, marginTop: 4,
  },
  btnPrimary: {
    paddingHorizontal: 18, paddingVertical: 12, backgroundColor: colors.primary,
    borderRadius: 10, alignItems: 'center', minWidth: 160,
  },
  btnPrimaryText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  btnOutline: {
    paddingHorizontal: 18, paddingVertical: 12, backgroundColor: 'transparent',
    borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  btnOutlineText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  btnDisabled: { opacity: 0.6 },

  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' },
  toast: { backgroundColor: '#0f172a', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  toastText: { color: colors.white, fontSize: 13 },
});
