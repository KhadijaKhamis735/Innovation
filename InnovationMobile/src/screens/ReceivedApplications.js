import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { applicationsApi, classifyStageUpdateError } from '../api/opportunities';
import {
  STAGE_ORDER,
  stageLabel,
  stagePalette,
} from '../api/stages';
import { useFocusEffect } from '@react-navigation/native';

// Canonical stage vocabulary — single source of truth (api/stages.js).
// Re-derived here only so the screen's stage filter can render an "All"
// chip plus one chip per canonical stage in canonical order.
const FILTER_STAGES = ['All', ...STAGE_ORDER];

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ReceivedApplications({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('receivedApps');
  const [filterStage, setFilterStage] = useState('All');
  const [selectedApp, setSelectedApp] = useState(null);
  const [toast, setToast] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { height: windowHeight } = useWindowDimensions();

  const handleSidebarNav = (screen) => {
    setActiveScreen(screen);
  };

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  // Load applications from the owner-scoped aggregate. The backend
  // returns every applicant across every opportunity this funder owns
  // (admin sees all), newest first. No client-side fan-out needed.
  const load = useCallback(async (mode = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setLoadError(null);
    try {
      const rows = await applicationsApi.listReceived();
      if (!mountedRef.current) return;
      const safe = Array.isArray(rows) ? rows : [];
      setApplications(safe);
    } catch (err) {
      if (!mountedRef.current) return;
      setApplications([]);
      setLoadError(err?.message ?? 'Failed to load applications');
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Mounted guard — prevents state writes after the screen unmounts.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => { load('initial'); }, [load]);

  // Phase 7 — refresh on focus so a new application or a stage change
  // is reflected when the user returns to this screen.
  useFocusEffect(useCallback(() => { load('refresh'); }, [load]));

  // Build the filterable view. The plan keeps the per-row stage filter
  // but drops the per-opportunity filter: the screen is already
  // opportunity-scoped (one funder's applications), so a separate
  // opportunity dropdown adds noise without adding value.
  const filteredApps = useMemo(() => {
    if (filterStage === 'All') return applications;
    return applications.filter((a) => a.stage === filterStage);
  }, [applications, filterStage]);

  const stats = useMemo(() => ({
    total:        applications.length,
    under_review: applications.filter((a) => a.stage === 'under_review').length,
    interview:    applications.filter((a) => a.stage === 'interview').length,
    pitch:        applications.filter((a) => a.stage === 'pitch').length,
    shortlisted:  applications.filter((a) => a.stage === 'shortlisted').length,
    accepted:     applications.filter((a) => a.stage === 'accepted').length,
  }), [applications]);

  // Move a single application to a new stage. The backend enforces
  // owner-only + verified-email, both of which surface as 4xx and the
  // toast simply echoes whatever the server said.
  const moveStage = async (appId, newStage) => {
    setUpdatingId(appId);
    try {
      const updated = await applicationsApi.updateStage(appId, newStage);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, stage: updated.stage } : a))
      );
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp((prev) => ({ ...prev, stage: updated.stage }));
      }
      showToast(`Moved to ${stageLabel(updated.stage)}`);
    } catch (err) {
      const c = classifyStageUpdateError(err);
      showToast(c.message ?? `Failed to update stage: ${err?.message ?? 'unknown error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <View style={styles.root}>
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={handleSidebarNav}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType="funder"
        />
      )}

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle}>Applications Received</Text>
          <Text style={styles.pageSubtitle}>
            {loading
              ? 'Loading…'
              : `${filteredApps.length} of ${applications.length} application${applications.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      </View>

      <ScrollView
        style={[styles.body, { height: windowHeight - 80, flex: undefined }]}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} />
        }
      >
        {/* Stats — 6 cards. The counts come from the live received list,
            so they always match the rows below. */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.blueLight }]}>
              <Text style={[styles.statIconText, { color: colors.blue }]}>📄</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{loading ? '…' : stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={[styles.statIconText, { color: '#d97706' }]}>⏰</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{loading ? '…' : stats.under_review}</Text>
              <Text style={styles.statLabel}>Under Review</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.blueLight }]}>
              <Text style={[styles.statIconText, { color: '#3b82f6' }]}>👥</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{loading ? '…' : stats.interview}</Text>
              <Text style={styles.statLabel}>Interview</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.purpleLight }]}>
              <Text style={[styles.statIconText, { color: colors.purple }]}>★</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{loading ? '…' : stats.pitch}</Text>
              <Text style={styles.statLabel}>Pitch</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
              <Text style={[styles.statIconText, { color: '#7c3aed' }]}>✓</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{loading ? '…' : stats.shortlisted}</Text>
              <Text style={styles.statLabel}>Shortlisted</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.greenLight }]}>
              <Text style={[styles.statIconText, { color: colors.green }]}>✅</Text>
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{loading ? '…' : stats.accepted}</Text>
              <Text style={styles.statLabel}>Accepted</Text>
            </View>
          </View>
        </View>

        {/* Stage filter — one chip per canonical stage. */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Stage:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTER_STAGES.map((stage) => {
              const palette = stagePalette(stage);
              const isActive = filterStage === stage;
              return (
                <TouchableOpacity
                  key={stage}
                  style={[
                    styles.filterBtn,
                    isActive && stage !== 'All' && {
                      backgroundColor: palette.bg,
                      borderColor: palette.text,
                    },
                    isActive && stage === 'All' && styles.filterBtnActive,
                  ]}
                  onPress={() => setFilterStage(stage)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isActive && stage !== 'All' && { color: palette.text, fontWeight: '600' },
                      isActive && stage === 'All' && styles.filterTextActive,
                    ]}
                  >
                    {stage === 'All' ? 'All' : stageLabel(stage)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Inline load error — keeps the layout intact and offers Retry. */}
        {loadError && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Couldn't load applications: {loadError}</Text>
            <TouchableOpacity style={styles.btnOutline} onPress={() => load('refresh')} activeOpacity={0.85}>
              <Text style={styles.btnOutlineText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Applications list */}
        {loading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.primary ?? '#f97316'} />
            <Text style={styles.loadingText}>Loading applications…</Text>
          </View>
        ) : filteredApps.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>📄</Text>
            </View>
            <Text style={styles.emptyTitle}>No applications found</Text>
            <Text style={styles.emptyDesc}>
              {applications.length === 0
                ? 'You have no received applications yet. Post an opportunity to start receiving submissions.'
                : 'No applications match the current filters.'}
            </Text>
          </View>
        ) : (
          <View>
            {filteredApps.map((app) => {
              const palette = stagePalette(app.stage);
              const displayName = app.ideaTitle || 'Untitled application';
              return (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appRow}>
                    <View style={[styles.appAvatar, { backgroundColor: palette.bg }]}>
                      <Text style={[styles.appAvatarText, { color: palette.text }]}>
                        {(app.innovatorName || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.appInfo}>
                      <Text style={styles.appTitle} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text style={styles.appSubtitle} numberOfLines={1}>
                        by {app.innovatorName} • {app.opportunityTitle}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.appStageRow}>
                    <View style={[styles.stageBadge, { backgroundColor: palette.bg }]}>
                      <Text style={[styles.stageBadgeText, { color: palette.text }]}>
                        {stageLabel(app.stage)}
                      </Text>
                    </View>
                    <Text style={styles.appDate}>{formatDate(app.appliedAt)}</Text>
                    <View style={styles.appActions}>
                      <TouchableOpacity
                        style={styles.btnOutline}
                        onPress={() => setSelectedApp(app)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.btnOutlineText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Application detail modal — mirrors web's structure: pipeline +
          innovator strip + idea fields + stage-move bar. */}
      <Modal
        visible={!!selectedApp}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedApp(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedApp(null)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {selectedApp?.ideaTitle || 'Untitled application'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  by {selectedApp?.innovatorName} • {formatDate(selectedApp?.appliedAt)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedApp(null)}
                style={styles.modalClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedApp && (() => {
                const palette = stagePalette(selectedApp.stage);
                return (
                  <>
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Current Stage</Text>
                      <View style={styles.modalStageRow}>
                        <View style={[styles.stageBadge, styles.stageBadgeLarge, { backgroundColor: palette.bg }]}>
                          <Text style={[styles.stageBadgeText, { color: palette.text, fontSize: 13 }]}>
                            {stageLabel(selectedApp.stage)}
                          </Text>
                        </View>
                        <Text style={styles.modalAppliedTo}>
                          Applied to: {selectedApp.opportunityTitle}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Innovator Information</Text>
                      <View style={styles.innovatorInfoRow}>
                        <View style={[styles.innovatorAvatar, { backgroundColor: palette.bg }]}>
                          <Text style={[styles.innovatorAvatarText, { color: palette.text }]}>
                            {(selectedApp.innovatorName || '?').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.innovatorName}>{selectedApp.innovatorName}</Text>
                          <Text style={styles.innovatorEmail}>{selectedApp.innovatorEmail}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Idea</Text>
                      <Text style={styles.modalSectionText}>{selectedApp.ideaTitle || '—'}</Text>
                    </View>

                    {!!selectedApp.problemStatement && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Problem Statement</Text>
                        <Text style={styles.modalSectionText}>{selectedApp.problemStatement}</Text>
                      </View>
                    )}

                    {!!selectedApp.proposedSolution && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Proposed Solution</Text>
                        <Text style={styles.modalSectionText}>{selectedApp.proposedSolution}</Text>
                      </View>
                    )}

                    {selectedApp.estimatedBudget != null && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Estimated Budget</Text>
                        <Text style={styles.modalSectionText}>
                          ${Number(selectedApp.estimatedBudget).toLocaleString()}
                        </Text>
                      </View>
                    )}

                    {/* Stage move bar — one button per other stage. */}
                    <View style={styles.stageMoveBar}>
                      <Text style={styles.stageMoveLabel}>Move to</Text>
                      <View style={styles.stageMoveButtons}>
                        {STAGE_ORDER
                          .filter((s) => s !== selectedApp.stage)
                          .map((s) => {
                            const btnPalette = stagePalette(s);
                            const isTerminal = s === 'accepted' || s === 'rejected';
                            return (
                              <TouchableOpacity
                                key={s}
                                style={[
                                  styles.stageMoveBtn,
                                  isTerminal && s === 'accepted' && styles.stageMoveBtnAccept,
                                  isTerminal && s === 'rejected' && styles.stageMoveBtnReject,
                                  !isTerminal && { backgroundColor: btnPalette.bg, borderColor: btnPalette.text },
                                ]}
                                onPress={() => moveStage(selectedApp.id, s)}
                                disabled={updatingId === selectedApp.id}
                                activeOpacity={0.85}
                              >
                                {updatingId === selectedApp.id ? (
                                  <ActivityIndicator size="small" color={colors.textSecondary} />
                                ) : (
                                  <Text
                                    style={[
                                      styles.stageMoveBtnText,
                                      isTerminal && s === 'accepted' && { color: colors.white },
                                      isTerminal && s === 'rejected' && { color: '#dc2626' },
                                      !isTerminal && { color: btnPalette.text },
                                    ]}
                                  >
                                    {stageLabel(s)}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                      </View>
                    </View>
                  </>
                );
              })()}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Toast — mirrors web .toast */}
      {!!toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* Top bar */
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
  menuIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  topBarCenter: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Body */
  body: {
    // flex intentionally not set — explicit pixel height applied via inline style
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bottomPad: {
    height: 24,
  },

  /* Stats — 6 cards (mobile wraps onto 2 rows of 3) */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flexBasis: '31%',
    flexGrow: 1,
    minWidth: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconText: {
    fontSize: 14,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },

  /* Filter group */
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  filterGroupLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    width: 60,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },

  /* Error block */
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
  },

  /* Loading block */
  loadingBlock: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  /* Application row */
  appCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  appInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  appSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  appStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.background,
    gap: 8,
  },
  appDate: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  appActions: {
    flexDirection: 'row',
    gap: 8,
  },
  stageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stageBadgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Buttons */
  btnOutline: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnOutlineText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.white,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIconText: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  /* Detail modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalBody: {
    padding: 18,
  },
  modalSection: {
    marginBottom: 18,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  modalAppliedTo: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  innovatorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  innovatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innovatorAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  innovatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  innovatorEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Stage move bar */
  stageMoveBar: {
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginTop: 4,
  },
  stageMoveLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  stageMoveButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageMoveBtn: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: '47%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  stageMoveBtnAccept: {
    backgroundColor: colors.green ?? '#16a34a',
    borderColor: colors.green ?? '#16a34a',
  },
  stageMoveBtnReject: {
    backgroundColor: colors.white,
    borderColor: '#dc2626',
  },
  stageMoveBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Toast */
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toastText: {
    color: colors.white,
    fontSize: 13,
  },
});