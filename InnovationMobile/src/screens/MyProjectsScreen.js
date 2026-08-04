import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { useFocusEffect } from '@react-navigation/native';
import { projectsApi } from '../api/projects';
import {
  PHASE_ORDER,
  phaseLabel,
  phasePalette,
  approvalPalette,
} from '../api/phases';
import { ApiError } from '../api/client';

const PHASE_FILTERS = ['all', ...PHASE_ORDER];

// Backend ISO timestamp → "Mar 2025" footer label. Returns the raw
// value on missing/invalid input so the UI never crashes.
const formatProjectStart = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const completedMilestoneCount = (project) => {
  const list = Array.isArray(project?.milestones) ? project.milestones : [];
  return list.filter((m) => m && m.completed).length;
};

export default function MyProjectsScreen({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('projects');
  const [selectedPhase, setSelectedPhase] = useState('all');

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load / reload the innovator's projects. Called both on mount
  // (initial load) and via pull-to-refresh. Filters the list to the
  // INNOVATION surface defensively even though the JWT guarantees
  // it, so a future mixed-role view doesn't accidentally mix CLUB
  // rows in here.
  const load = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'initial') setLoading(true);
    setError(null);
    try {
      const rows = await projectsApi.listMine();
      const list = Array.isArray(rows) ? rows : [];
      const innovationOnly = list.filter((p) => p && (p.surface ?? 'innovation') === 'innovation');
      // Newest first — `updatedAt` descending.
      innovationOnly.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      setProjects(innovationOnly);
    } catch (e) {
      const msg = e instanceof ApiError
        ? (e.message || 'Could not load your projects.')
        : (e?.message || 'Could not load your projects.');
      setError(msg);
    } finally {
      if (mode === 'refresh') setRefreshing(false);
      if (mode === 'initial') setLoading(false);
    }
  }, []);

  useEffect(() => { load('initial'); }, [load]);

  // Refetch when the screen regains focus so a project edited via
  // the detail screen, or approved by an admin in another client,
  // shows up without a manual reload.
  useFocusEffect(useCallback(() => { load('refresh'); }, [load]));

  const filtered = useMemo(() => {
    if (selectedPhase === 'all') return projects;
    return projects.filter((p) => p.phase === selectedPhase);
  }, [projects, selectedPhase]);

  const onCreate = () => navigation.navigate('InnovationProjectCreate');
  const onOpen = (projectId) => navigation.navigate('InnovationProjectDetail', { projectId });

  return (
    <SafeAreaView style={styles.container}>
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType="innovator"
        />
      )}

      {/* Top bar — mirrors web .top-bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle}>My Projects</Text>
          <Text style={styles.pageSubtitle}>Track your innovation journey through each phase</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={onCreate} activeOpacity={0.85}>
          <Text style={styles.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        scrollEnabled
        alwaysBounceVertical
        bounces
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={colors.primary} />
        }
      >
        {/* Phase filter */}
        <View style={styles.filterContainer}>
          {PHASE_FILTERS.map((phaseId) => {
            const active = selectedPhase === phaseId;
            const label = phaseId === 'all' ? 'All' : phaseLabel(phaseId);
            return (
              <TouchableOpacity
                key={phaseId}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedPhase(phaseId)}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Body — loading / error / empty / list */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loaderText}>Loading your projects…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Couldn’t load your projects</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => load('initial')} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              {projects.length === 0
                ? 'You haven’t created any projects yet.'
                : 'No projects in this phase.'}
            </Text>
            <Text style={styles.emptyText}>
              Start by creating a project — add a name, tagline, and an initial milestone.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={onCreate} activeOpacity={0.85}>
              <Text style={styles.emptyBtnText}>+ Create Your First Project</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.projectsContainer}>
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPress={() => onOpen(project.id)}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProjectCard({ project, onPress }) {
  const palette  = phasePalette(project.phase);
  const approval = approvalPalette(project.approvalStatus || 'pending');
  const done     = completedMilestoneCount(project);
  const total    = Array.isArray(project.milestones) ? project.milestones.length : 0;
  const showZsa  = project.approvalStatus === 'approved' && project.zsaId;
  const startLabel = formatProjectStart(project.startDate);

  return (
    <TouchableOpacity style={styles.projectCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.projectHeader}>
        <View style={{ flex: 1 }}>
          {showZsa ? (
            <Text style={styles.projectZsaId}>{project.zsaId}</Text>
          ) : (
            <Text style={styles.projectZsaIdPlaceholder}>— pending approval —</Text>
          )}
          <Text style={styles.projectName}>{project.name}</Text>
          {project.category ? <Text style={styles.projectCategory}>{project.category}</Text> : null}
        </View>
        <View style={[styles.phaseBadge, { backgroundColor: palette.bg }]}>
          <Text style={[styles.phaseText, { color: palette.color }]}>{phaseLabel(project.phase)}</Text>
        </View>
      </View>

      {project.tagline ? (
        <Text style={styles.projectDesc} numberOfLines={2}>{project.tagline}</Text>
      ) : null}

      <View style={styles.metaRow}>
        <View style={[styles.approvalPill, { backgroundColor: approval.bg }]}>
          <Text style={[styles.approvalPillText, { color: approval.color }]}>
            {(project.approvalStatus || 'pending').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.milestoneMeta}>
          {done}/{total} milestone{total === 1 ? '' : 's'} complete
        </Text>
      </View>

      <View style={styles.projectFooter}>
        <Text style={styles.projectDate}>Started {startLabel}</Text>
        <Text style={styles.viewButtonText}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

  /* Top bar — mirrors PostOpportunity / InnovatorDashboard */
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
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  menuIcon: { fontSize: 20, color: colors.textSecondary },
  topBarCenter: { flex: 1 },
  pageTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  createBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: colors.primary, minHeight: 36, justifyContent: 'center',
  },
  createBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  /* Phase filter row */
  filterContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, paddingVertical: 16, gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: colors.white },

  /* States */
  loader: { paddingVertical: 32, alignItems: 'center', gap: 8 },
  loaderText: { fontSize: 12, color: colors.textSecondary },
  errorBox: {
    marginHorizontal: 20, padding: 18, borderRadius: 14,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    gap: 10,
  },
  errorTitle: { fontSize: 14, fontWeight: '700', color: colors.error },
  errorText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  retryBtn: {
    alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 10, backgroundColor: colors.primary,
  },
  retryBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  emptyBox: {
    marginHorizontal: 20, padding: 24, borderRadius: 16,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', gap: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, textAlign: 'center' },
  emptyBtn: {
    marginTop: 6, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10,
    backgroundColor: colors.primary,
  },
  emptyBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  /* Cards */
  projectsContainer: { paddingHorizontal: 20, gap: 14 },
  projectCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  projectHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10, gap: 12,
  },
  projectZsaId: { fontSize: 11, color: colors.textMuted, marginBottom: 4, fontWeight: '600' },
  projectZsaIdPlaceholder: { fontSize: 11, color: colors.textMuted, marginBottom: 4, fontStyle: 'italic' },
  projectName: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  projectCategory: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  phaseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  phaseText: { fontSize: 12, fontWeight: '600' },

  projectDesc: {
    fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 12,
  },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  approvalPill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  approvalPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  milestoneMeta: { fontSize: 12, color: colors.textMuted },

  projectFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border,
  },
  projectDate: { fontSize: 12, color: colors.textMuted },
  viewButtonText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  bottomPad: { height: 24 },
});
