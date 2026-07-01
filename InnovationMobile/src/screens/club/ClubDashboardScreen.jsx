import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../../styles/colors';
import { clubStyles } from '../../styles/clubStyles';
import { useApp } from '../../context/AppContext';
import Sidebar from '../../components/Sidebar';

// ClubDashboardScreen — member-facing hub
// ----------------------------------------
// Layout (top → bottom), chosen to match your function list:
//   1. Status banner  — membership + university + project count
//   2. My projects    — mini list (taps open ClubProjectDetail)
//   3. My activities  — Upcoming + Past mini lists
//   4. My applications— mini list
//   5. Quick links    — Activities, Leadership, Resources, Opportunities
//
// All data is read from AppContext, so this screen is a pure view.

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const STATUS_PILL = {
  active:  { bg: clubStyles.statusActive,  text: clubStyles.statusActiveText },
  pending: { bg: clubStyles.statusPending, text: clubStyles.statusPendingText },
  none:    { bg: clubStyles.statusNone,    text: clubStyles.statusNoneText },
};

export default function ClubDashboardScreen({ navigation }) {
  const {
    user, projects, activityParticipations, activities,
    applications, meetings, announcements,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('clubDashboard');
  const { height: windowHeight } = useWindowDimensions();

  const userInitials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`;

  // Activities the user joined, split into upcoming + past.
  const { upcomingActs, pastActs } = useMemo(() => {
    const now = Date.now();
    const joined = activities.filter((a) =>
      activityParticipations.some((p) => p.activityId === a.id && p.userId === user.id),
    );
    const up = [];
    const pa = [];
    joined.forEach((a) => {
      const t = new Date(a.date).getTime();
      if (t >= now) up.push(a); else pa.push(a);
    });
    up.sort((a, b) => new Date(a.date) - new Date(b.date));
    pa.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { upcomingActs: up, pastActs: pa };
  }, [activities, activityParticipations, user.id]);

  const myApps = useMemo(
    () => applications.filter((a) => a.userId === user.id).slice(0, 3),
    [applications, user.id],
  );

  const nextMeeting = useMemo(() => {
    const now = Date.now();
    return [...meetings]
      .filter((m) => new Date(m.date).getTime() >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  }, [meetings]);

  const recentAnnouncement = announcements[0];
  const pill = STATUS_PILL[user.membershipStatus] || STATUS_PILL.none;

  return (
    <View style={styles.root}>
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
          style={styles.menuBtn}
          onPress={() => setSidebarOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle}>Club Dashboard</Text>
          <Text style={styles.pageSubtitle}>Welcome back, {user.firstName}!</Text>
        </View>
        <View style={styles.topBarRight}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ height: windowHeight - 80 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator
        alwaysBounceVertical
      >
        {/* 1. Status banner */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>{user.universityName || 'Innovation Club'}</Text>
              <Text style={styles.statusSubtitle}>
                {user.regNumber ? `Reg no. ${user.regNumber}` : 'No registration number yet'}
              </Text>
            </View>
            <View style={[clubStyles.statusPill, pill.bg]}>
              <View style={[clubStyles.statusPillDot, { backgroundColor: pill.text.color }]} />
              <Text style={[clubStyles.statusPillText, pill.text]}>
                {user.membershipStatus === 'active' ? 'Active'
                  : user.membershipStatus === 'pending' ? 'Pending'
                  : 'Not a member'}
              </Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{projects.length}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{upcomingActs.length}</Text>
              <Text style={styles.statLabel}>Upcoming acts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myApps.length}</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
          </View>
        </View>

        {/* 2. My projects */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>My projects</Text>
              <Text style={styles.cardSubtitle}>Track progress and add evidence.</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('MyProjects')}>
              <Text style={styles.cardLink}>See all →</Text>
            </TouchableOpacity>
          </View>
          {projects.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚀</Text>
              <Text style={styles.emptyText}>
                No projects yet. Create one — it will appear in Innovation too.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('ClubCreateProject')}
              >
                <Text style={styles.emptyBtnText}>+ New project</Text>
              </TouchableOpacity>
            </View>
          ) : (
            projects.slice(0, 3).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.projectRow}
                onPress={() => navigation.navigate('ClubProjectDetail', { projectId: p.id })}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.projectName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.projectMeta} numberOfLines={1}>
                    📂 {p.category} · {p.phase}
                  </Text>
                </View>
                {p.source === 'club' && (
                  <View style={styles.miniClubTag}>
                    <Text style={styles.miniClubTagText}>Club</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 3. My activities */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>My activities</Text>
              <Text style={styles.cardSubtitle}>Upcoming and past.</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('MyActivities')}>
              <Text style={styles.cardLink}>See all →</Text>
            </TouchableOpacity>
          </View>

          {upcomingActs.length > 0 && (
            <>
              <Text style={styles.subhead}>Upcoming</Text>
              {upcomingActs.slice(0, 3).map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.activityRow}
                  onPress={() => navigation.navigate('ActivityDetail', { activityId: a.id })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.activityDate}>{formatDate(a.date)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle} numberOfLines={1}>{a.title}</Text>
                    <Text style={styles.activityMeta} numberOfLines={1}>{a.type}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {pastActs.length > 0 && (
            <>
              <Text style={[styles.subhead, { marginTop: 12 }]}>Past</Text>
              {pastActs.slice(0, 2).map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.activityRow, styles.activityRowPast]}
                  onPress={() => navigation.navigate('ActivityDetail', { activityId: a.id })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.activityDate}>{formatDate(a.date)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle} numberOfLines={1}>{a.title}</Text>
                    <Text style={styles.activityMeta} numberOfLines={1}>Attended</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {upcomingActs.length === 0 && pastActs.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>
                You haven't registered for any activities yet.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('ClubActivities')}
              >
                <Text style={styles.emptyBtnText}>Browse activities</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 4. My applications */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>My applications</Text>
              <Text style={styles.cardSubtitle}>Track opportunities you've applied to.</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('MyApplications')}>
              <Text style={styles.cardLink}>See all →</Text>
            </TouchableOpacity>
          </View>

          {myApps.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📤</Text>
              <Text style={styles.emptyText}>
                Use one of your projects to apply for funding.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('BrowseOpportunities')}
              >
                <Text style={styles.emptyBtnText}>Browse opportunities</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myApps.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.appRow}
                onPress={() => navigation.navigate('MyApplications')}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle} numberOfLines={1}>{a.title || 'Application'}</Text>
                  <Text style={styles.activityMeta} numberOfLines={1}>{a.status || 'Pending'}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 5. Quick links */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick links</Text>
          <View style={styles.linkGrid}>
            {[
              { label: 'Browse activities', icon: '🎯', screen: 'ClubActivities' },
              { label: 'Leadership & meetings', icon: '👥', screen: 'ClubLeadership' },
              { label: 'Resources', icon: '📚', screen: 'ClubResources' },
              { label: 'Opportunities', icon: '💡', screen: 'BrowseOpportunities' },
              { label: 'Membership', icon: '🎓', screen: 'ClubMembership' },
              { label: 'Create project', icon: '🚀', screen: 'ClubCreateProject' },
            ].map((l) => (
              <TouchableOpacity
                key={l.label}
                style={styles.linkTile}
                onPress={() => navigation.navigate(l.screen)}
                activeOpacity={0.85}
              >
                <Text style={styles.linkIcon}>{l.icon}</Text>
                <Text style={styles.linkLabel}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Next meeting banner — only when one is upcoming */}
        {nextMeeting && (
          <TouchableOpacity
            style={styles.meetingBanner}
            onPress={() => navigation.navigate('MeetingDetail', { meetingId: nextMeeting.id })}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.meetingBannerLabel}>Next meeting</Text>
              <Text style={styles.meetingBannerTitle} numberOfLines={1}>{nextMeeting.title}</Text>
              <Text style={styles.meetingBannerMeta}>
                {formatDate(nextMeeting.date)} · {nextMeeting.time}
              </Text>
            </View>
            <Text style={styles.meetingBannerArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Latest announcement — only when one exists */}
        {recentAnnouncement && (
          <TouchableOpacity
            style={styles.announceBanner}
            onPress={() => navigation.navigate('ClubResources')}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.announceLabel}>Latest announcement</Text>
              <Text style={styles.announceTitle} numberOfLines={1}>{recentAnnouncement.title}</Text>
              <Text style={styles.announceBody} numberOfLines={2}>{recentAnnouncement.body}</Text>
            </View>
            <Text style={styles.announceArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

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
  pageTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  body: { padding: 16, paddingBottom: 40 },

  /* Status card */
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 16,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  statusSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  statRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  /* Cards */
  card: {
    backgroundColor: colors.white,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 8, marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  cardSubtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  cardLink: { fontSize: 12, color: colors.primary, fontWeight: '700' },

  subhead: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },

  /* Projects list */
  projectRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  projectName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  projectMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  miniClubTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  miniClubTagText: { fontSize: 9, fontWeight: '700', color: '#1d4ed8' },

  /* Activities */
  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  activityRowPast: { opacity: 0.65 },
  activityDate: {
    fontSize: 10, fontWeight: '700', color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    minWidth: 64, textAlign: 'center',
  },
  activityTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  activityMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  /* Applications */
  appRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },

  /* Empty */
  empty: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  emptyIcon: { fontSize: 28 },
  emptyText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 17, maxWidth: 280 },
  emptyBtn: {
    marginTop: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.primary, borderRadius: 10,
  },
  emptyBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },

  /* Quick links */
  linkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  linkTile: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 10,
  },
  linkIcon: { fontSize: 16 },
  linkLabel: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, flex: 1 },

  /* Meeting + announcement banners */
  meetingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 14, padding: 14, marginBottom: 12,
  },
  meetingBannerLabel: { fontSize: 10, fontWeight: '700', color: '#fed7aa', textTransform: 'uppercase', letterSpacing: 0.5 },
  meetingBannerTitle: { fontSize: 14, fontWeight: '700', color: colors.white, marginTop: 2 },
  meetingBannerMeta: { fontSize: 11, color: '#fed7aa', marginTop: 2 },
  meetingBannerArrow: { fontSize: 22, color: colors.white, fontWeight: '700' },

  announceBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  announceLabel: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  announceTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  announceBody: { fontSize: 11, color: colors.textSecondary, marginTop: 4, lineHeight: 16 },
  announceArrow: { fontSize: 22, color: colors.textMuted, fontWeight: '700' },
});