import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { applicationsApi } from '../api/opportunities';
import {
  stageLabel,
  stagePalette,
  PENDING_STAGES,
  PAST_STAGES,
} from '../api/stages';

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return iso;
  }
};

export default function MyApplicationsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('applications');

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true); else setLoading(true);
    setLoadError(null);
    try {
      const list = await applicationsApi.listMine();
      if (!mountedRef.current) return;
      setApplications(Array.isArray(list) ? list : []);
    } catch (e) {
      if (!mountedRef.current) return;
      setLoadError(e?.message ?? 'Unable to load applications');
    } finally {
      if (!mountedRef.current) return;
      if (mode === 'refresh') setRefreshing(false); else setLoading(false);
    }
  }, []);

  // Mounted guard — prevents state writes after the screen unmounts.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => { load('initial'); }, [load]);

  // Phase 7 — refresh on focus so a stage change on the funder side
  // is reflected when the innovator returns to this screen.
  useFocusEffect(useCallback(() => { load('refresh'); }, [load]));

  // "Pending" mirrors PENDING_STAGES (in-progress); "Past Results" is
  // PAST_STAGES. Anything outside both buckets (defensive) falls into Past.
  const { pendingApps, pastApps } = useMemo(() => {
    const pending = [];
    const past = [];
    for (const app of applications) {
      const stage = app.stage ?? 'submitted';
      if (PENDING_STAGES.has(stage)) pending.push(app);
      else if (PAST_STAGES.has(stage)) past.push(app);
      else past.push(app); // unknown stage → fall back to past so the user sees it
    }
    // Server already returns newest-first; sort defensively to guarantee order
    // even when stage buckets split a list.
    const sortBy = (a, b) => {
      const ta = new Date(a.appliedAt ?? a.updatedAt ?? 0).getTime();
      const tb = new Date(b.appliedAt ?? b.updatedAt ?? 0).getTime();
      return tb - ta;
    };
    pending.sort(sortBy);
    past.sort(sortBy);
    return { pendingApps: pending, pastApps: past };
  }, [applications]);

  const displayedApps = activeTab === 'pending' ? pendingApps : pastApps;

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

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle}>My Applications</Text>
          <Text style={styles.pageSubtitle}>
            {applications.length} total · {pendingApps.length} pending
          </Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading applications…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <View style={styles.errorBlock}>
            <Text style={styles.errorTitle}>We couldn't load your applications</Text>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => load('initial')}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
          scrollEnabled
          alwaysBounceVertical
          bounces
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                Pending ({pendingApps.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'past' && styles.tabActive]}
              onPress={() => setActiveTab('past')}
            >
              <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                Past Results ({pastApps.length})
              </Text>
            </TouchableOpacity>
          </View>

          {displayedApps.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                {activeTab === 'pending'
                  ? 'No applications in progress'
                  : 'No past applications yet'}
              </Text>
              <Text style={styles.emptyStateText}>
                {activeTab === 'pending'
                  ? 'When you apply to an opportunity, it will show up here.'
                  : 'Once a funder accepts or rejects an application, it will land here.'}
              </Text>
            </View>
          ) : (
            <View style={styles.applicationsContainer}>
              {displayedApps.map((app) => {
                const palette = stagePalette(app.stage);
                return (
                  <View key={app.id} style={styles.applicationCard}>
                    <View style={styles.appHeader}>
                      <View style={styles.appAvatar}>
                        <Text style={styles.appAvatarText}>
                          {(app.opportunityTitle || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.appInfo}>
                        <Text style={styles.appTitle}>{app.opportunityTitle}</Text>
                        <Text style={styles.appOrganization}>
                          {app.ideaTitle || '—'}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}>
                        <Text style={[styles.statusText, { color: palette.text }]}>
                          {stageLabel(app.stage)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.appDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Submitted</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(app.appliedAt)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Last update</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(app.updatedAt)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.viewButton}>
                      <Text style={styles.viewButtonText}>View Details →</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 40 },

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
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 8, color: colors.textSecondary, fontSize: 13 },

  errorBlock: {
    padding: 16, borderRadius: 12,
    backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca',
    width: '100%',
  },
  errorTitle: { fontSize: 14, fontWeight: '700', color: '#7f1d1d', marginBottom: 4 },
  errorText: { fontSize: 13, color: '#991b1b', marginBottom: 12 },
  retryButton: {
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, backgroundColor: '#7f1d1d',
  },
  retryButtonText: { color: colors.white, fontSize: 13, fontWeight: '600' },

  tabContainer: {
    flexDirection: 'row', margin: 16, backgroundColor: colors.white,
    borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.white },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateTitle: {
    fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4,
  },
  emptyStateText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  applicationsContainer: { padding: 16, gap: 16 },
  applicationCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  appHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8,
  },
  appAvatar: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 4,
  },
  appAvatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  appInfo: { flex: 1 },
  appTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  appOrganization: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },

  appDetails: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: colors.border, marginBottom: 12, gap: 12,
  },
  detailRow: { flex: 1 },
  detailLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },

  viewButton: { alignItems: 'flex-end' },
  viewButtonText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
});
