import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { opportunitiesApi, applicationsApi } from '../api/opportunities';
import { stageLabel, stagePalette, PAST_STAGES } from '../api/stages';

const quickActions = [
  { label: 'Browse Opportunities', icon: '🔍', screen: 'BrowseOpportunities', color: 'primary' },
  { label: 'My Applications', icon: '📄', screen: 'MyApplications', color: 'secondary' },
  { label: 'View Projects', icon: '📁', screen: 'MyProjects', color: 'secondary' },
];

const helpItems = [
  { title: 'My Projects', desc: 'Track your project milestones', icon: '📁', screen: 'MyProjects' },
  { title: 'Browse Opportunities', desc: 'Find funding for your innovation', icon: '🔍', screen: 'BrowseOpportunities' },
  { title: 'Settings', desc: 'Manage your account', icon: '⚙️', screen: 'Settings' },
];

// Safe date formatter used for both opportunity deadlines and application
// timestamps. Returns the raw ISO string on missing/invalid input so the
// dashboard never renders a fatal crash.
const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};
const formatDeadline = formatDate;
const formatAppliedAt = formatDate;

const getStatPalette = (color) => {
  switch (color) {
    case 'blue':   return { bg: colors.blueLight, fg: colors.blue };
    case 'orange': return { bg: colors.primaryLight, fg: colors.primary };
    case 'purple': return { bg: colors.purpleLight, fg: colors.purple };
    case 'green':  return { bg: colors.greenLight, fg: colors.green };
    default:       return { bg: colors.primaryLight, fg: colors.primary };
  }
};

export default function InnovatorDashboard({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('dashboard');

  // `useAuth().user` is the source of truth for the authenticated
  // innovator — the dashboard greets the user by first/last name from
  // the JWT principal.
  const { user: authUser } = useAuth();
  const user = {
    firstName: authUser?.firstName || 'Innovator',
    lastName:  authUser?.lastName  || '',
  };

  const handleSidebarNav = (screen) => {
    setActiveScreen(screen);
  };

  const { height: windowHeight } = useWindowDimensions();

  // Phase 3 — load applications + a small slice of the public open
  // feed. Both errors are surfaced as "no rows" rather than a hard fail
  // so the rest of the dashboard still renders on cold start.
  const [applications, setApplications] = useState([]);
  const [feedOpps, setFeedOpps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [appsLoading, setAppsLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);

  const load = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'initial') { setAppsLoading(true); setFeedLoading(true); }
    try {
      // Reuse opportunitiesApi — listMine is the innovator-only /applications/me
      const [apps, opp] = await Promise.all([
        applicationsApi.listMine().catch(() => []),
        opportunitiesApi.list({ status: 'open' }).catch(() => []),
      ]);
      // Guard — don't write state if the user has already navigated away.
      if (!mountedRef.current) return;
      setApplications(Array.isArray(apps) ? apps : []);
      setFeedOpps(Array.isArray(opp) ? opp.slice(0, 3) : []);
    } finally {
      if (!mountedRef.current) return;
      if (mode === 'refresh') setRefreshing(false);
      if (mode === 'initial') { setAppsLoading(false); setFeedLoading(false); }
    }
  }, []);

  // Mounted guard — prevents state writes after the screen unmounts.
  const mountedRef = React.useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => { load('initial'); }, [load]);

  // Phase 7 — refresh on focus so a stage change on the web or on a
  // nested screen is reflected when the user returns to the dashboard.
  useFocusEffect(useCallback(() => { load('refresh'); }, [load]));

  // Derived stats from real applications — replaces seeded mock values.
  const stats = useMemo(() => {
    const total = applications.length;
    const inReview = applications.filter(
      (a) => a.stage && ['under_review', 'interview', 'pitch', 'shortlisted', 'submitted'].includes(a.stage),
    ).length;
    const successful = applications.filter((a) => PAST_STAGES.has(a.stage) && a.stage === 'accepted').length;
    return [
      // Active projects belongs to My Projects phase — leave the label
      // but keep it queryable; we surface a 0 here because Phase 3
      // doesn't read projects. Update in Phase 4.
      { label: 'Active Projects', value: '—', icon: '📁', color: 'blue' },
      { label: 'Applications Sent', value: String(total), icon: '📤', color: 'orange' },
      { label: 'In Review', value: String(inReview), icon: '⏰', color: 'purple' },
      { label: 'Successful', value: String(successful), icon: '✅', color: 'green' },
    ];
  }, [applications]);

  // Notifications stay unread; funder-driven stage changes aren't yet
  // pushed to the mobile inbox (deferred).
  const notifications = [];
  const unreadCount = 0;
  const userInitials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`;

  return (
    <View style={styles.root}>
      {/* Sidebar drawer (overlays everything) */}
      {sidebarOpen && (
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={handleSidebarNav}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
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
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSubtitle}>
            Welcome back, {user.firstName}!
          </Text>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setNotifOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={notifications.length === 0}
          >
            <Text style={styles.iconBtnText}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            tintColor={colors.primary}
          />
        }
      >
        {/* Stats grid — 2 cols on mobile (4 on web) */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => {
            const palette = getStatPalette(stat.color);
            return (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: palette.bg }]}>
                  <Text style={[styles.statIconText, { color: palette.fg }]}>
                    {stat.icon}
                  </Text>
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Applications — full-width card, vertical list */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Applications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyApplications')}>
              <Text style={styles.cardLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {appsLoading ? (
            <View style={styles.rowLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : applications.length === 0 ? (
            <View style={styles.emptyInline}>
              <Text style={styles.emptyInlineText}>
                You haven't applied to any opportunities yet. Browse the feed below to get started.
              </Text>
            </View>
          ) : (
            <View style={styles.appsList}>
              {applications.slice(0, 3).map((app) => {
                const palette = stagePalette(app.stage);
                return (
                  <TouchableOpacity
                    key={app.id}
                    style={styles.appCard}
                    onPress={() => navigation.navigate('MyApplications')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.appCardHeader}>
                      <Text style={styles.appTitle} numberOfLines={1}>
                        {app.opportunityTitle}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: palette.text }]}>
                          {stageLabel(app.stage)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.appOrg}>{app.ideaTitle || '—'}</Text>
                    <Text style={styles.appDate}>
                      Submitted {formatAppliedAt(app.appliedAt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickActions}>
            {quickActions.map((action) => {
              const isPrimary = action.color === 'primary';
              return (
                <TouchableOpacity
                  key={action.label}
                  style={[
                    styles.quickActionBtn,
                    isPrimary ? styles.quickActionPrimary : styles.quickActionSecondary,
                  ]}
                  onPress={() => navigation.navigate(action.screen)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      isPrimary ? styles.quickActionIconPrimary : styles.quickActionIconSecondary,
                    ]}
                  >
                    <Text style={styles.quickActionIconText}>{action.icon}</Text>
                  </View>
                  <Text
                    style={[
                      styles.quickActionLabel,
                      isPrimary && styles.quickActionLabelPrimary,
                    ]}
                  >
                    {action.label}
                  </Text>
                  <Text
                    style={[
                      styles.quickActionArrow,
                      isPrimary && styles.quickActionArrowPrimary,
                    ]}
                  >
                    →
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Latest Opportunities */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Latest Opportunities</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BrowseOpportunities')}>
              <Text style={styles.cardLink}>Browse All</Text>
            </TouchableOpacity>
          </View>

          {feedLoading ? (
            <View style={styles.rowLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : feedOpps.length === 0 ? (
            <View style={styles.emptyInline}>
              <Text style={styles.emptyInlineText}>
                No open opportunities right now. Check back soon.
              </Text>
            </View>
          ) : (
            <View style={styles.oppList}>
              {feedOpps.map((opp) => (
                <TouchableOpacity
                  key={opp.id}
                  style={styles.oppItem}
                  onPress={() => navigation.navigate('BrowseOpportunities')}
                  activeOpacity={0.7}
                >
                  <View style={styles.oppHeader}>
                    <Text style={styles.oppTitle} numberOfLines={1}>{opp.title}</Text>
                    <View style={styles.oppTypeBadge}>
                      <Text style={styles.oppTypeBadgeText}>{(opp.type ?? 'opportunity').toString()}</Text>
                    </View>
                  </View>
                  <Text style={styles.oppOrg}>
                    {opp.funderOrganizationName || opp.funderName || '—'}
                  </Text>
                  <View style={styles.oppMeta}>
                    <Text style={styles.oppAmount}>{opp.amount || 'Equity-free'}</Text>
                    <Text style={styles.oppDeadline}>📅 {formatDeadline(opp.deadline)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Club — surfaces the new register-as-club-member flow */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Club</Text>
              <Text style={styles.cardSubtitle}>
                Join the club to unlock activities, leadership, and shared projects.
              </Text>
            </View>
          </View>

          <View style={styles.clubRow}>
            <View style={[styles.clubBadge, styles.clubBadgeInactive]}>
              <Text style={styles.clubBadgeIcon}>✚</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clubLabel}>Become a club member</Text>
              <Text style={styles.clubMeta}>
                Pick your university + reg number
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.clubBtn, styles.clubBtnPrimary]}
              onPress={() => navigation.navigate('Register', { role: 'club_member' })}
            >
              <Text style={[styles.clubBtnText, styles.clubBtnTextPrimary]}>Join →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help & Resources */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Help & Resources</Text>
          </View>

          <View style={styles.helpList}>
            {helpItems.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.helpItem}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.helpIcon}>
                  <Text style={styles.helpIconText}>{item.icon}</Text>
                </View>
                <View style={styles.helpContent}>
                  <Text style={styles.helpTitle}>{item.title}</Text>
                  <Text style={styles.helpDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Notifications modal — replaces the web dropdown */}
      <Modal
        visible={notifOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setNotifOpen(false)}
      >
        <Pressable style={styles.notifOverlay} onPress={() => setNotifOpen(false)}>
          <Pressable style={styles.notifSheet} onPress={() => {}}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifOpen(false)}>
                <Text style={styles.notifClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.notifList}>
              {notifications.map((n) => (
                <View
                  key={n.id}
                  style={[styles.notifItem, n.unread && styles.notifItemUnread]}
                >
                  <View style={styles.notifDotCol}>
                    {n.unread && <View style={styles.notifDot} />}
                  </View>
                  <View style={styles.notifBody}>
                    <Text style={styles.notifItemTitle}>{n.title}</Text>
                    <Text style={styles.notifItemMessage}>{n.message}</Text>
                    <Text style={styles.notifItemTime}>{n.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBtnText: {
    fontSize: 18,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
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

  /* Recent applications — vertical stack */
  appsList: {
    gap: 10,
  },
  /* Inline loader + empty state used by Recent Applications / Latest Opportunities */
  rowLoader: {
    paddingVertical: 18, alignItems: 'center',
  },
  emptyInline: {
    paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 10, backgroundColor: colors.background,
  },
  emptyInlineText: {
    fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18,
  },
  appCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  appCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  appTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  appOrg: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  appDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
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
  quickActionPrimary: {
    backgroundColor: colors.primary,
    borderColor: 'transparent',
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
  quickActionIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  quickActionLabelPrimary: {
    color: colors.white,
  },
  quickActionArrow: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '700',
  },
  quickActionArrowPrimary: {
    color: colors.white,
  },

  /* Opportunities */
  oppList: {
    gap: 10,
  },
  oppItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  oppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  oppTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  oppTypeBadge: {
    backgroundColor: colors.blueLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  oppTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.blue,
  },
  oppOrg: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  oppMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  oppAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.green,
  },
  oppDeadline: {
    fontSize: 11,
    color: colors.textMuted,
  },

  /* Help */
  helpList: {
    gap: 10,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: 12,
  },

  /* Club card on Innovator Dashboard */
  cardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  clubBadge: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  clubBadgeActive:   { backgroundColor: colors.greenLight },
  clubBadgeInactive: { backgroundColor: colors.primaryLight },
  clubBadgeIcon: { fontSize: 22 },
  clubLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  clubMeta:  { fontSize: 11, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  clubBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clubBtnPrimary:   { backgroundColor: colors.primary },
  clubBtnSecondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  clubBtnText: { fontSize: 13, fontWeight: '700' },
  clubBtnTextPrimary:   { color: colors.white },
  clubBtnTextSecondary: { color: colors.textPrimary },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIconText: {
    fontSize: 18,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  helpDesc: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  /* Notifications modal */
  notifOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  notifSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notifClose: {
    fontSize: 18,
    color: colors.textSecondary,
    paddingHorizontal: 6,
  },
  notifList: {
    paddingHorizontal: 4,
  },
  notifItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifItemUnread: {
    backgroundColor: colors.primaryLight,
  },
  notifDotCol: {
    width: 14,
    alignItems: 'center',
    paddingTop: 6,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notifBody: {
    flex: 1,
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  notifItemMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 4,
  },
  notifItemTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
