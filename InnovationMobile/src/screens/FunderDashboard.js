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
  useWindowDimensions,
} from 'react-native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { opportunitiesApi, applicationsApi } from '../api/opportunities';
import { stageLabel, stagePalette } from '../api/stages';
import { useFocusEffect } from '@react-navigation/native';

const getStatPalette = (color) => {
  switch (color) {
    case 'blue':   return { bg: colors.blueLight, fg: colors.blue };
    case 'orange': return { bg: colors.primaryLight, fg: colors.primary };
    case 'purple': return { bg: colors.purpleLight, fg: colors.purple };
    case 'green':  return { bg: colors.greenLight, fg: colors.green };
    default:       return { bg: colors.primaryLight, fg: colors.primary };
  }
};

export default function FunderDashboard({ navigation }) {
  const { user: authUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('funderDashboard');
  // Phase 5 — headline opp stats + per-row applicant counts sourced from
  // GET /api/opportunities/me.
  const [oppStats, setOppStats] = useState({ total: 0, open: 0, applicants: 0 });
  // Phase 6 — funder-wide received applications + stage-derived totals.
  // "Under Review" tile and "Recent Applications" card both read from this.
  const [received, setReceived] = useState([]);
  const [receivedStats, setReceivedStats] = useState({ underReview: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mirrors the web's `user?.name` — now sourced from the live auth
  // context. Falls back to an empty object while the /me hydrate is
  // still in flight so the rest of the render stays safe.
  const user = authUser ?? { firstName: '', lastName: '' };

  const handleSidebarNav = (screen) => {
    setActiveScreen(screen);
  };

  const { height: windowHeight } = useWindowDimensions();

  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '··';

  // Phase 6 — load both endpoints in parallel. The /api/opportunities/me
  // call drives the open-aggregate tiles (Phase 5). The new
  // /api/applications/received call drives the "Under Review" tile and
  // the "Recent Applications" card. Each failure is isolated so one
  // outage doesn't blank the whole dashboard — surfaces fall back to
  // zeros rather than fake numbers.
  const loadStats = useCallback(async (mode = 'initial') => {
    if (mode === 'initial') setStatsLoading(true);
    else setRefreshing(true);
    const results = await Promise.allSettled([
      opportunitiesApi.listMine(),
      applicationsApi.listReceived(),
    ]);
    // Mounted guard — drop the result if the user navigated away.
    if (!mountedRef.current) return;
    const opps = results[0].status === 'fulfilled' && Array.isArray(results[0].value)
      ? results[0].value
      : [];
    const apps = results[1].status === 'fulfilled' && Array.isArray(results[1].value)
      ? results[1].value
      : [];
    setOppStats({
      total: opps.length,
      open: opps.filter((o) => String(o.status || '').toLowerCase() === 'open').length,
      applicants: opps.reduce((sum, o) => sum + (Number(o.applicantCount) || 0), 0),
    });
    setReceived(apps);
    setReceivedStats({
      underReview: apps.filter((a) => a.stage === 'under_review').length,
    });
    setStatsLoading(false);
    setRefreshing(false);
  }, []);

  // Mounted guard — prevents state writes after the screen unmounts.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => { loadStats('initial'); }, [loadStats]);

  // Phase 7 — refresh on focus so a stage change (mobile or web) is
  // reflected when the user returns to the dashboard.
  useFocusEffect(useCallback(() => { loadStats('refresh'); }, [loadStats]));

  // Top 3 received applications by appliedAt desc — derived from the live
  // list. Sorted defensively so an out-of-order response from the server
  // doesn't surface stale rows in the "Recent" card.
  const recentApplications = useMemo(
    () =>
      [...received]
        .sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0))
        .slice(0, 3),
    [received]
  );

  const formatApplied = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.root}>
      {/* Sidebar drawer (overlays everything) */}
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={handleSidebarNav}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          userType="funder"
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
          <Text style={styles.pageTitle}>Funder Dashboard</Text>
          <Text style={styles.pageSubtitle}>
            Welcome back, {user.firstName}!
          </Text>
        </View>

        <View style={styles.topBarRight}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
        </View>
      </View>

      {/* Scrollable dashboard body */}
      <ScrollView
        style={[styles.body, { height: windowHeight - 80, flex: undefined }]}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        alwaysBounceVertical={true}
        bounces={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadStats('refresh')} />
        }
      >
        {/* Stats grid — 2 cols on mobile (4 on web).
           Phase 5: cards 1 + 3 sourced from /api/opportunities/me.
           Phase 6: card 2 (Under Review) sourced from /api/applications/received.
           Card 4 stays as a Phase 7 placeholder (Funded Projects) — we have
           no mobile-side funding flow yet, so we don't fabricate the number. */}
        <View style={styles.statsGrid}>
          {[
            {
              label: 'Active Opportunities',
              value: statsLoading ? '…' : String(oppStats.open),
              icon: '📂',
              color: 'blue',
            },
            {
              label: 'Under Review',
              value: statsLoading ? '…' : String(receivedStats.underReview),
              icon: '⏰',
              color: 'purple',
            },
            {
              label: 'Total Applicants',
              value: statsLoading ? '…' : String(oppStats.applicants),
              icon: '📝',
              color: 'orange',
            },
            {
              label: 'Funded Projects',
              value: '—',
              icon: '✅',
              color: 'green',
              placeholder: true,
            },
          ].map((stat) => {
            const palette = getStatPalette(stat.color);
            return (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: palette.bg }]}>
                  <Text style={[styles.statIconText, { color: palette.fg }]}>
                    {stat.icon}
                  </Text>
                </View>
                <View style={styles.statInfo}>
                  <Text
                    style={[
                      styles.statValue,
                      stat.placeholder && { color: colors.textMuted },
                    ]}
                  >
                    {stat.value}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickActionSecondary]}
              onPress={() => navigation.navigate('PostOpportunity')}
              activeOpacity={0.85}
            >
              <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
                <Text style={styles.quickActionIconText}>➕</Text>
              </View>
              <Text style={styles.quickActionLabel}>Post New Opportunity</Text>
              <Text style={styles.quickActionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickActionSecondary]}
              onPress={() => navigation.navigate('ReceivedApplications')}
              activeOpacity={0.85}
            >
              <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
                <Text style={styles.quickActionIconText}>📋</Text>
              </View>
              <Text style={styles.quickActionLabel}>Review Applications</Text>
              <Text style={styles.quickActionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickActionSecondary]}
              onPress={() => navigation.navigate('MyOpportunities')}
              activeOpacity={0.85}
            >
              <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
                <Text style={styles.quickActionIconText}>📢</Text>
              </View>
              <Text style={styles.quickActionLabel}>Manage Opportunities</Text>
              <Text style={styles.quickActionArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Funded Projects — placeholder until Phase 7 wires a real
             project-side read. We deliberately don't fabricate rows. */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Funded Projects</Text>
          </View>
          <View style={styles.fundedEmpty}>
            <Text style={styles.fundedEmptyTitle}>No funded projects yet</Text>
            <Text style={styles.fundedEmptyDesc}>
              Funded projects will appear here once accepted applications
              progress through the milestones flow.
            </Text>
          </View>
        </View>

        {/* Recent Applications — top 3 from /api/applications/received */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Applications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReceivedApplications')}>
              <Text style={styles.cardLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {statsLoading ? (
            <View style={styles.recentLoadingRow}>
              <Text style={styles.recentLoadingText}>Loading…</Text>
            </View>
          ) : recentApplications.length === 0 ? (
            <View style={styles.recentEmpty}>
              <Text style={styles.recentEmptyText}>
                No applications received yet. Once innovators apply to your
                opportunities they'll show up here.
              </Text>
            </View>
          ) : (
            <View style={styles.appsList}>
              {recentApplications.map((app) => {
                const palette = stagePalette(app.stage);
                return (
                  <TouchableOpacity
                    key={app.id}
                    style={styles.appItem}
                    onPress={() => navigation.navigate('ReceivedApplications')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.appInfo}>
                      <Text style={styles.appTitle} numberOfLines={1}>
                        {app.ideaTitle || 'Untitled application'}
                      </Text>
                      <Text style={styles.appOrg} numberOfLines={1}>
                        {app.innovatorName}
                      </Text>
                      <Text style={styles.appDate}>{formatApplied(app.appliedAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: palette.text }]}>
                        {stageLabel(app.stage)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* Top bar — mirrors web .top-bar */
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
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
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

  /* Stats grid */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconText: {
    fontSize: 20,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Cards */
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },

  /* Quick actions */
  quickActions: {
    gap: 10,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  quickActionSecondary: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconSecondary: {
    backgroundColor: colors.primaryLight,
  },
  quickActionIconText: {
    fontSize: 16,
  },
  quickActionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quickActionArrow: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '700',
  },

  /* Recent applications — mirrors web .applications-list */
  appsList: {
    gap: 10,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    gap: 10,
  },
  appInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  appOrg: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  appDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  /* Recent applications — loading + empty states */
  recentLoadingRow: {
    paddingVertical: 12,
  },
  recentLoadingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recentEmpty: {
    paddingVertical: 12,
  },
  recentEmptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  /* Funded Projects — honest empty state */
  fundedEmpty: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  fundedEmptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  fundedEmptyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
