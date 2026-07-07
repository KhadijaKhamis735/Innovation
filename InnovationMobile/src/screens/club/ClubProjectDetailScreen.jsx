import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  SafeAreaView,
  Modal,
  Pressable,
} from 'react-native';
import { colors } from '../../styles/colors';
import Sidebar from '../../components/Sidebar';
import { useApp } from '../../context/AppContext';

// ClubProjectDetailScreen
// -----------------------
// Opens from MyProjectsScreen when the user taps a card. Shows the
// project header, current phase, milestones, and an Evidence section
// where the user can add and remove evidence items.
//
// Evidence is a lightweight record (title, type, optional url) — no
// actual file uploads. The list of evidence is read from context so
// multiple members could see the same evidence later if we add
// shared projects; for now it's per-account.

const PHASES = [
  { id: 'idea',      label: 'Idea' },
  { id: 'proposal',  label: 'Proposal' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'mvp',       label: 'MVP' },
  { id: 'scaling',   label: 'Scaling' },
];

const EVIDENCE_TYPES = [
  { id: 'doc',   label: 'Document', icon: '📄' },
  { id: 'image', label: 'Image',    icon: '🖼️' },
  { id: 'video', label: 'Video',    icon: '🎥' },
  { id: 'link',  label: 'Link',     icon: '🔗' },
];

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const phaseIndex = (id) => PHASES.findIndex((p) => p.id === id);

export default function ClubProjectDetailScreen({ navigation, route }) {
  const { projectId } = route.params || {};
  const { projects, projectEvidence, addProjectEvidence, removeProjectEvidence } = useApp();

  const project = projects.find((p) => p.id === projectId);

  // Add-evidence modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [evTitle, setEvTitle] = useState('');
  const [evType, setEvType] = useState('doc');
  const [evUrl, setEvUrl] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('clubDashboard');

  const evidence = useMemo(
    () => projectEvidence.filter((e) => e.projectId === projectId),
    [projectEvidence, projectId],
  );

  if (!project) {
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
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setSidebarOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.topBarCenter}><Text style={styles.pageTitle}>Project</Text></View>
          <View style={styles.topBarRight} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Project not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleOpen = async (url) => {
    if (!url) return;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else Alert.alert('Cannot open link', url);
    } catch {
      Alert.alert('Error', 'Could not open the link.');
    }
  };

  const handleSaveEvidence = () => {
    if (evTitle.trim().length < 2) {
      Alert.alert('Add a title', 'Give the evidence a short name (e.g. "User interview notes").');
      return;
    }
    if ((evType === 'link' || evType === 'image' || evType === 'video') && !evUrl.trim()) {
      Alert.alert('Missing URL', 'Add a URL for this evidence type.');
      return;
    }
    addProjectEvidence({ projectId, title: evTitle, type: evType, url: evUrl });
    setEvTitle('');
    setEvType('doc');
    setEvUrl('');
    setModalOpen(false);
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
          <Text style={styles.pageTitle} numberOfLines={1}>Project</Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.zsaId}>{project.zsaId}</Text>
          <Text style={styles.title}>{project.name}</Text>
          {project.source === 'club' && (
            <View style={styles.clubTag}>
              <Text style={styles.clubTagText}>🎓 Club project</Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>📂 {project.category}</Text>
            <Text style={styles.metaText}>📅 {project.date}</Text>
          </View>
          {project.description ? (
            <Text style={styles.desc}>{project.description}</Text>
          ) : null}
        </View>

        {/* Phase progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Phase progress</Text>
          <View style={styles.phaseRow}>
            {PHASES.map((p, i) => {
              const current = phaseIndex(project.phase);
              const done = i < current;
              const active = i === current;
              return (
                <View key={p.id} style={styles.phaseItem}>
                  <View
                    style={[
                      styles.phaseDot,
                      done && styles.phaseDotDone,
                      active && styles.phaseDotActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.phaseDotText,
                        (done || active) && styles.phaseDotTextOn,
                      ]}
                    >
                      {done ? '✓' : i + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.phaseLabel,
                      active && styles.phaseLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {p.label}
                  </Text>
                  {i < PHASES.length - 1 && <View style={[styles.phaseLine, done && styles.phaseLineDone]} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Evidence */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Evidence</Text>
              <Text style={styles.cardSubtitle}>
                Documents, images, videos, or links that back up your progress.
              </Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {evidence.length === 0 ? (
            <View style={styles.evidenceEmpty}>
              <Text style={styles.evidenceEmptyIcon}>📎</Text>
              <Text style={styles.evidenceEmptyText}>
                No evidence yet. Add survey results, screenshots, demo videos, or links.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {evidence.map((e) => {
                const meta = EVIDENCE_TYPES.find((t) => t.id === e.type) || EVIDENCE_TYPES[0];
                return (
                  <View key={e.id} style={styles.evidenceRow}>
                    <View style={styles.evidenceIconWrap}>
                      <Text style={styles.evidenceIcon}>{meta.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.evidenceTitle} numberOfLines={1}>{e.title}</Text>
                      <Text style={styles.evidenceMeta}>
                        {meta.label} · {formatDate(e.addedAt)}
                      </Text>
                      {e.url ? (
                        <TouchableOpacity onPress={() => handleOpen(e.url)}>
                          <Text style={styles.evidenceLink} numberOfLines={1}>{e.url}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => removeProjectEvidence(e.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.evidenceDelete}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick action: apply to opportunities with this project */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Use this project</Text>
          <Text style={styles.cardSubtitle}>
            Apply for funding opportunities using this project.
          </Text>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => navigation.navigate('BrowseOpportunities')}
          >
            <Text style={styles.applyBtnText}>Browse opportunities →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add evidence modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add evidence</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. User interview notes"
                  placeholderTextColor={colors.textMuted}
                  value={evTitle}
                  onChangeText={setEvTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.typeRow}>
                  {EVIDENCE_TYPES.map((t) => {
                    const active = t.id === evType;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                        onPress={() => setEvType(t.id)}
                      >
                        <Text style={styles.typeIcon}>{t.icon}</Text>
                        <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {evType !== 'doc' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {evType === 'image' ? 'Image URL *'
                      : evType === 'video' ? 'Video URL *'
                      : 'Link URL *'}
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="https://…"
                    placeholderTextColor={colors.textMuted}
                    value={evUrl}
                    onChangeText={setEvUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEvidence}>
                <Text style={styles.saveBtnText}>Save evidence</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: colors.textSecondary, fontSize: 14 },

  /* Header card */
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  zsaId: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginTop: 4, letterSpacing: -0.3 },
  clubTag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  clubTagText: { fontSize: 10, fontWeight: '700', color: '#1d4ed8' },
  metaRow: { flexDirection: 'row', gap: 14, marginTop: 10 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: 12 },

  /* Generic card */
  card: {
    backgroundColor: colors.white,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  cardSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: 12 },

  /* Phase progress */
  phaseRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  phaseItem: { flex: 1, alignItems: 'center', position: 'relative' },
  phaseDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  phaseDotDone:   { backgroundColor: colors.green },
  phaseDotActive: { backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.primaryLight },
  phaseDotText:   { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  phaseDotTextOn: { color: colors.white },
  phaseLabel: { fontSize: 9, color: colors.textMuted, marginTop: 4, textAlign: 'center', fontWeight: '600' },
  phaseLabelActive: { color: colors.primary, fontWeight: '700' },
  phaseLine: {
    position: 'absolute',
    top: 14, left: '50%', right: '-50%',
    height: 2, backgroundColor: colors.border, zIndex: 1,
  },
  phaseLineDone: { backgroundColor: colors.green },

  /* Evidence */
  addBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.primary, borderRadius: 10,
  },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  evidenceEmpty: { alignItems: 'center', paddingVertical: 18, gap: 6 },
  evidenceEmptyIcon: { fontSize: 30 },
  evidenceEmptyText: {
    fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 17, maxWidth: 280,
  },
  evidenceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  evidenceIconWrap: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  evidenceIcon: { fontSize: 18 },
  evidenceTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  evidenceMeta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  evidenceLink: { fontSize: 11, color: colors.primary, marginTop: 4, fontWeight: '600' },
  evidenceDelete: { fontSize: 18, color: colors.textMuted, paddingHorizontal: 6 },

  /* Apply */
  applyBtn: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1, borderColor: colors.primaryBorder,
    paddingVertical: 12, borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  modalClose: { fontSize: 18, color: colors.textSecondary, paddingHorizontal: 6 },
  modalBody: { padding: 18, paddingBottom: 32 },

  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  formInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 14, color: colors.textPrimary, backgroundColor: colors.white,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeIcon: { fontSize: 14 },
  typeLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  typeLabelActive: { color: colors.white },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});