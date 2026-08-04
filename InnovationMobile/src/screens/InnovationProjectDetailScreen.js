import React, { useCallback, useEffect, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import {
  projectsApi,
  toUpdateBody,
  toMilestoneBody,
  classifyProjectError,
} from '../api/projects';
import {
  PHASE_ORDER,
  PHASE_LABELS,
  phasePalette,
  approvalPalette,
} from '../api/phases';
import EvidencePanel from '../components/EvidencePanel';
import { verificationRequired } from '../api/client';

// Date helpers used by edit metadata + milestone completedDate
const formatProjectStart = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 10);
};

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};

export default function InnovationProjectDetailScreen({ navigation, route }) {
  const projectId = Number(route?.params?.projectId);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('projects');

  const [project, setProject] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');

  // ── Load full project + attachments ──────────────────────────
  const load = useCallback(async () => {
    if (!projectId) {
      setError('Missing project id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [proj, atts] = await Promise.all([
        projectsApi.getById(projectId),
        projectsApi.listAttachments(projectId).catch(() => []),
      ]);
      setProject(proj);
      setAttachments(Array.isArray(atts) ? atts : []);
    } catch (e) {
      const cls = classifyProjectError(e);
      setError(cls.message || 'Could not load the project.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { if (projectId) load(); }, [load, projectId]));

  // ── Edit metadata state ──────────────────────────────────────
  const [editForm, setEditForm] = useState(null);
  const [savingMeta, setSavingMeta] = useState(false);

  const beginEditMeta = () => {
    if (!project) return;
    setEditForm({
      name: project.name || '',
      tagline: project.tagline || '',
      description: project.description || '',
      category: project.category || '',
      startDate: formatProjectStart(project.startDate),
      tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
    });
  };

  const cancelEditMeta = () => setEditForm(null);

  const saveMeta = useCallback(async () => {
    if (!project || !editForm) return;
    if (!editForm.name.trim()) {
      Alert.alert('Name required', 'Project name cannot be empty.');
      return;
    }
    setSavingMeta(true);
    try {
      const body = toUpdateBody(editForm);
      const updated = await projectsApi.update(project.id, body);
      setProject((prev) => ({ ...prev, ...updated }));
      setEditForm(null);
      showToast('Project updated.');
    } catch (e) {
      handleWriteError(e, 'Could not save changes.');
    } finally {
      setSavingMeta(false);
    }
  }, [project, editForm]);

  // ── Phase change ─────────────────────────────────────────────
  const [phaseSaving, setPhaseSaving] = useState(false);
  const changePhase = useCallback(async (next) => {
    if (!project || project.phase === next || phaseSaving) return;
    const previous = project.phase;
    setProject((prev) => prev ? { ...prev, phase: next } : prev);
    setPhaseSaving(true);
    try {
      const updated = await projectsApi.updatePhase(project.id, next);
      setProject((prev) => ({ ...prev, ...updated }));
      showToast(`Phase set to ${PHASE_LABELS[next] || next}.`);
    } catch (e) {
      setProject((prev) => prev ? { ...prev, phase: previous } : prev);
      handleWriteError(e, 'Could not update phase.');
    } finally {
      setPhaseSaving(false);
    }
  }, [project, phaseSaving]);

  // ── Milestones ───────────────────────────────────────────────
  const [milestoneSavingId, setMilestoneSavingId] = useState(null);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', description: '' });

  const toggleMilestoneCompleted = useCallback(async (milestone) => {
    if (!project || milestoneSavingId === milestone.id) return;
    const next = !milestone.completed;
    // Optimistic
    setProject((prev) => prev ? {
      ...prev,
      milestones: prev.milestones.map((m) => m.id === milestone.id
        ? { ...m, completed: next, completedDate: next ? new Date().toISOString().slice(0, 10) : null }
        : m),
    } : prev);
    setMilestoneSavingId(milestone.id);
    try {
      const updated = await projectsApi.updateMilestone(
        project.id, milestone.id,
        toMilestoneBody({ completed: next }),
      );
      setProject((prev) => prev ? {
        ...prev,
        milestones: prev.milestones.map((m) => m.id === milestone.id ? updated : m),
      } : prev);
    } catch (e) {
      // revert on failure
      setProject((prev) => prev ? {
        ...prev,
        milestones: prev.milestones.map((m) => m.id === milestone.id ? milestone : m),
      } : prev);
      handleWriteError(e, 'Could not toggle milestone.');
    } finally {
      setMilestoneSavingId(null);
    }
  }, [project, milestoneSavingId]);

  const deleteMilestone = useCallback((milestone) => {
    if (!project) return;
    Alert.alert(
      'Delete milestone?',
      milestone.name || 'This milestone',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const previous = project.milestones;
            setProject((prev) => prev ? {
              ...prev,
              milestones: prev.milestones.filter((m) => m.id !== milestone.id),
            } : prev);
            try {
              await projectsApi.removeMilestone(project.id, milestone.id);
              showToast('Milestone deleted.');
            } catch (e) {
              setProject((prev) => prev ? { ...prev, milestones: previous } : prev);
              handleWriteError(e, 'Could not delete milestone.');
            }
          },
        },
      ],
    );
  }, [project]);

  const handleAddMilestone = useCallback(async () => {
    if (!project || addingMilestone) return;
    if (!newMilestone.name.trim()) {
      Alert.alert('Name required', 'Milestone name cannot be empty.');
      return;
    }
    setAddingMilestone(true);
    try {
      const created = await projectsApi.addMilestone(project.id, toMilestoneBody(newMilestone));
      setProject((prev) => prev ? {
        ...prev,
        milestones: [...(prev.milestones || []), created],
      } : prev);
      setNewMilestone({ name: '', description: '' });
      showToast('Milestone added.');
    } catch (e) {
      handleWriteError(e, 'Could not add milestone.');
    } finally {
      setAddingMilestone(false);
    }
  }, [project, newMilestone, addingMilestone]);

  // ── Delete project ───────────────────────────────────────────
  const handleDeleteProject = useCallback(() => {
    if (!project) return;
    Alert.alert(
      'Delete project?',
      `“${project.name}” will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectsApi.remove(project.id);
              showToast('Project deleted.');
              setTimeout(() => navigation.navigate('MyProjects'), 200);
            } catch (e) {
              handleWriteError(e, 'Could not delete the project.');
            }
          },
        },
      ],
    );
  }, [project, navigation]);

  // ── helpers ──────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleWriteError = (err, fallback) => {
    if (verificationRequired(err)) {
      Alert.alert(
        'Verify your email first',
        'You need to verify your email before making changes.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Verify now', onPress: () => navigation.navigate('VerifyEmail') },
        ],
      );
      return;
    }
    const cls = classifyProjectError(err);
    setError(cls.message || fallback);
  };

  if (loading && !project) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading project…</Text>
      </View>
    );
  }

  if (error && !project) {
    return (
      <View style={styles.errorRoot}>
        <Text style={styles.errorTitle}>Couldn’t load the project</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('MyProjects')} activeOpacity={0.7}>
          <Text style={styles.backLinkText}>← Back to My Projects</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!project) return null;

  const palette  = phasePalette(project.phase);
  const approval = approvalPalette(project.approvalStatus || 'pending');
  const done = (project.milestones || []).filter((m) => m.completed).length;
  const total = (project.milestones || []).length;

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
          style={styles.backBtn}
          onPress={() => navigation.navigate('MyProjects')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle}>Project</Text>
          <Text style={styles.pageSubtitle} numberOfLines={1}>{project.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            {project.approvalStatus === 'approved' && project.zsaId ? (
              <Text style={styles.headerZsaId}>{project.zsaId}</Text>
            ) : (
              <Text style={styles.headerPending}>Awaiting admin approval</Text>
            )}
            <View style={[styles.approvalPill, { backgroundColor: approval.bg }]}>
              <Text style={[styles.approvalPillText, { color: approval.color }]}>
                {(project.approvalStatus || 'pending').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.headerName}>{project.name}</Text>
          {project.tagline ? <Text style={styles.headerTagline}>{project.tagline}</Text> : null}
          <View style={styles.metaRow}>
            <View style={[styles.phaseBadge, { backgroundColor: palette.bg }]}>
              <Text style={[styles.phaseText, { color: palette.color }]}>
                {PHASE_LABELS[project.phase] || project.phase}
              </Text>
            </View>
            {project.category ? <Text style={styles.metaText}>{project.category}</Text> : null}
            <Text style={styles.metaText}>{done}/{total} milestones</Text>
          </View>
        </View>

        {/* Phase chips */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Phase</Text>
          <View style={styles.phaseRow}>
            {PHASE_ORDER.map((phaseId) => {
              const ph = phasePalette(phaseId);
              const active = project.phase === phaseId;
              return (
                <TouchableOpacity
                  key={phaseId}
                  style={[
                    styles.phaseChip,
                    active && { borderColor: ph.color, backgroundColor: ph.bg },
                  ]}
                  onPress={() => changePhase(phaseId)}
                  activeOpacity={0.85}
                  disabled={phaseSaving}
                >
                  <Text style={[styles.phaseChipText, active && { color: ph.color }]}>
                    {PHASE_LABELS[phaseId]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {phaseSaving ? <Text style={styles.helperText}>Saving phase…</Text> : null}
        </View>

        {/* Metadata */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Details</Text>
            {editForm ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={cancelEditMeta} activeOpacity={0.85} disabled={savingMeta}>
                  <Text style={styles.linkAction}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveMeta} activeOpacity={0.85} disabled={savingMeta}>
                  {savingMeta ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Text style={[styles.linkAction, styles.linkActionStrong]}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={beginEditMeta} activeOpacity={0.85}>
                <Text style={styles.linkAction}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editForm ? (
            <EditMetaForm form={editForm} setForm={setEditForm} />
          ) : (
            <MetaView project={project} />
          )}
        </View>

        {/* Milestones */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          {(project.milestones || []).length === 0 ? (
            <Text style={styles.helperText}>No milestones yet. Add one below.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {(project.milestones || []).map((m) => (
                <MilestoneRow
                  key={m.id}
                  milestone={m}
                  saving={milestoneSavingId === m.id}
                  onToggle={() => toggleMilestoneCompleted(m)}
                  onDelete={() => deleteMilestone(m)}
                />
              ))}
            </View>
          )}

          <View style={styles.addMilestoneCard}>
            <Text style={styles.addMilestoneTitle}>Add milestone</Text>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Beta testing complete"
                placeholderTextColor={colors.textMuted}
                value={newMilestone.name}
                onChangeText={(v) => setNewMilestone((p) => ({ ...p, name: v }))}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextareaSmall]}
                placeholder="Optional"
                placeholderTextColor={colors.textMuted}
                multiline
                value={newMilestone.description}
                onChangeText={(v) => setNewMilestone((p) => ({ ...p, description: v }))}
              />
            </View>
            <TouchableOpacity
              style={[styles.btnPrimary, addingMilestone && styles.btnDisabled]}
              onPress={handleAddMilestone}
              activeOpacity={0.85}
              disabled={addingMilestone}
            >
              {addingMilestone ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>+ Add milestone</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Evidence */}
        <EvidencePanel
          projectId={project.id}
          attachments={attachments}
          onChange={setAttachments}
        />

        {/* Danger zone */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger zone</Text>
          <Text style={styles.helperText}>Deleting this project permanently removes it from the platform.</Text>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={handleDeleteProject}
            activeOpacity={0.85}
          >
            <Text style={styles.dangerBtnText}>Delete project</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.dismissError}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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

function MetaView({ project }) {
  return (
    <View style={{ gap: 10 }}>
      {project.description ? (
        <View>
          <Text style={styles.metaLabel}>Description</Text>
          <Text style={styles.metaValue}>{project.description}</Text>
        </View>
      ) : null}
      {project.startDate ? (
        <View>
          <Text style={styles.metaLabel}>Start date</Text>
          <Text style={styles.metaValue}>{formatDate(project.startDate)}</Text>
        </View>
      ) : null}
      {project.category ? (
        <View>
          <Text style={styles.metaLabel}>Category</Text>
          <Text style={styles.metaValue}>{project.category}</Text>
        </View>
      ) : null}
      {Array.isArray(project.tags) && project.tags.length ? (
        <View>
          <Text style={styles.metaLabel}>Tags</Text>
          <View style={styles.tagsRow}>
            {project.tags.map((t, i) => (
              <View key={i} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
            ))}
          </View>
        </View>
      ) : null}
      {!project.description && !project.startDate && !project.category && !(project.tags?.length) ? (
        <Text style={styles.helperText}>No details yet — tap Edit to add some.</Text>
      ) : null}
    </View>
  );
}

function EditMetaForm({ form, setForm }) {
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Name *</Text>
        <TextInput
          style={styles.formInput}
          value={form.name}
          onChangeText={(v) => update('name', v)}
          maxLength={160}
          placeholderTextColor={colors.textMuted}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Tagline</Text>
        <TextInput
          style={styles.formInput}
          value={form.tagline}
          onChangeText={(v) => update('tagline', v)}
          maxLength={240}
          placeholderTextColor={colors.textMuted}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Description</Text>
        <TextInput
          style={[styles.formInput, styles.formTextareaSmall]}
          value={form.description}
          onChangeText={(v) => update('description', v)}
          multiline
          maxLength={2000}
          placeholderTextColor={colors.textMuted}
        />
      </View>
      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Category</Text>
          <TextInput
            style={styles.formInput}
            value={form.category}
            onChangeText={(v) => update('category', v)}
            maxLength={120}
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Start date</Text>
          <TextInput
            style={styles.formInput}
            value={form.startDate}
            onChangeText={(v) => update('startDate', v)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Tags (comma-separated)</Text>
        <TextInput
          style={styles.formInput}
          value={form.tags}
          onChangeText={(v) => update('tags', v)}
          autoCapitalize="none"
          placeholderTextColor={colors.textMuted}
        />
      </View>
    </View>
  );
}

function MilestoneRow({ milestone, saving, onToggle, onDelete }) {
  return (
    <View style={styles.milestoneRow}>
      <TouchableOpacity
        style={[styles.checkbox, milestone.completed && styles.checkboxOn]}
        onPress={onToggle}
        activeOpacity={0.7}
        disabled={saving}
      >
        {milestone.completed ? <Text style={styles.checkboxMark}>✓</Text> : null}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[styles.milestoneName, milestone.completed && styles.milestoneNameDone]}>
          {milestone.name}
        </Text>
        {milestone.description ? (
          <Text style={styles.milestoneDesc} numberOfLines={2}>{milestone.description}</Text>
        ) : null}
        {milestone.completed && milestone.completedDate ? (
          <Text style={styles.milestoneMeta}>Completed {formatDate(milestone.completedDate)}</Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={saving}>
        <Text style={styles.removeAction}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.background },
  loadingText: { fontSize: 13, color: colors.textSecondary },
  errorRoot: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.background },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.error },
  errorBody: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 11, backgroundColor: colors.primary, borderRadius: 10 },
  retryBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  backLink: { marginTop: 6 },
  backLinkText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  backIcon: { fontSize: 20, color: colors.textSecondary },
  topBarCenter: { flex: 1 },
  pageTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  bottomPad: { height: 24 },

  headerCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  headerZsaId: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  headerPending: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic' },
  headerName: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  headerTagline: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  metaText: { fontSize: 12, color: colors.textMuted },
  phaseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  phaseText: { fontSize: 12, fontWeight: '600' },
  approvalPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  approvalPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },

  phaseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  phaseChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  phaseChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  helperText: { fontSize: 12, color: colors.textMuted, lineHeight: 17, marginTop: 8 },

  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  formInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    color: colors.textPrimary, backgroundColor: colors.white,
  },
  formTextareaSmall: { minHeight: 88, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: 12 },

  metaLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.background, borderRadius: 6 },
  tagText: { fontSize: 12, color: colors.textSecondary },

  linkAction: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  linkActionStrong: { fontWeight: '700' },

  milestoneRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  checkbox: {
    width: 26, height: 26, borderRadius: 6, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white, marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: colors.white, fontWeight: '700', fontSize: 14 },
  milestoneName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  milestoneNameDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  milestoneDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 17 },
  milestoneMeta: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  removeAction: { fontSize: 12, fontWeight: '700', color: colors.error },

  addMilestoneCard: {
    marginTop: 16, padding: 12, borderRadius: 12,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  addMilestoneTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },

  btnPrimary: {
    paddingHorizontal: 16, paddingVertical: 11, backgroundColor: colors.primary,
    borderRadius: 10, alignItems: 'center',
  },
  btnPrimaryText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },

  dangerCard: { borderColor: 'rgba(239, 68, 68, 0.3)' },
  dangerBtn: {
    marginTop: 12, paddingVertical: 11, borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', alignItems: 'center',
  },
  dangerBtnText: { color: colors.error, fontSize: 14, fontWeight: '700' },

  errorBanner: {
    marginTop: 12, padding: 12, borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  errorText: { flex: 1, fontSize: 12, color: '#b91c1c', lineHeight: 17 },
  dismissError: { fontSize: 12, fontWeight: '700', color: '#b91c1c' },

  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' },
  toast: { backgroundColor: '#0f172a', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  toastText: { color: colors.white, fontSize: 13 },
});
