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
import { useApp } from '../../context/AppContext';
import Sidebar from '../../components/Sidebar';

// ClubLeadershipScreen
// --------------------
// Three sections:
//   1. Current leadership team
//   2. Upcoming meetings
//   3. Open positions (with an "Apply" CTA → ApplyLeadershipScreen)
//
// All data comes from context, so when an admin updates the roster
// later, every screen reflects it without extra wiring.

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

export default function ClubLeadershipScreen({ navigation }) {
  const { leadership, meetings, openPositions, user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('clubLeadership');
  const { height: windowHeight } = useWindowDimensions();

  // Split meetings into upcoming and past, sort each appropriately.
  const { upcomingMeetings, pastMeetings } = useMemo(() => {
    const now = Date.now();
    const up = [];
    const pa = [];
    meetings.forEach((m) => {
      const t = new Date(m.date).getTime();
      if (t >= now) up.push(m);
      else pa.push(m);
    });
    up.sort((a, b) => new Date(a.date) - new Date(b.date));
    pa.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { upcomingMeetings: up, pastMeetings: pa };
  }, [meetings]);

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
          <Text style={styles.pageTitle}>Leadership & Meetings</Text>
          <Text style={styles.pageSubtitle}>
            {leadership.length} leaders · {upcomingMeetings.length} upcoming meetings
          </Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        style={{ height: windowHeight - 80 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator
        alwaysBounceVertical
      >
        {/* Leadership roster */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leadership team</Text>
          <View style={styles.leaderList}>
            {leadership.map((l) => (
              <View key={l.id} style={styles.leaderRow}>
                <View style={styles.leaderAvatar}>
                  <Text style={styles.leaderAvatarText}>{initials(l.name)}</Text>
                </View>
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>{l.name}</Text>
                  <Text style={styles.leaderRole}>{l.role}</Text>
                  <Text style={styles.leaderBio} numberOfLines={2}>{l.bio}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Meetings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meetings</Text>

          <Text style={styles.subhead}>Upcoming</Text>
          {upcomingMeetings.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming meetings.</Text>
          ) : (
            upcomingMeetings.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.meeting}
                onPress={() => navigation.navigate('MeetingDetail', { meetingId: m.id })}
                activeOpacity={0.85}
              >
                <View style={styles.meetingHeader}>
                  <Text style={styles.meetingTitle} numberOfLines={1}>{m.title}</Text>
                  <Text style={styles.meetingDate}>{formatDate(m.date)}</Text>
                </View>
                <Text style={styles.meetingMeta}>⏰ {m.time}</Text>
                <Text style={styles.meetingMeta}>
                  {m.meetingLink ? `💻 ${m.location} (has link)` : `📍 ${m.location}`}
                </Text>
                {m.agenda ? (
                  <View style={styles.agenda}>
                    <Text style={styles.agendaLabel}>Agenda</Text>
                    <Text style={styles.agendaText}>{m.agenda}</Text>
                  </View>
                ) : null}
                <Text style={styles.viewLink}>View details →</Text>
              </TouchableOpacity>
            ))
          )}

          {pastMeetings.length > 0 && (
            <>
              <Text style={[styles.subhead, { marginTop: 14 }]}>Past meetings</Text>
              {pastMeetings.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.meeting, styles.meetingPast]}
                  onPress={() => navigation.navigate('MeetingDetail', { meetingId: m.id })}
                  activeOpacity={0.85}
                >
                  <View style={styles.meetingHeader}>
                    <Text style={styles.meetingTitle} numberOfLines={1}>{m.title}</Text>
                    <Text style={styles.meetingDate}>{formatDate(m.date)}</Text>
                  </View>
                  <Text style={styles.meetingMeta}>⏰ {m.time}</Text>
                  <Text style={styles.meetingMeta}>📍 {m.location}</Text>
                  {m.minutes ? (
                    <View style={styles.agenda}>
                      <Text style={styles.agendaLabel}>Minutes</Text>
                      <Text style={styles.agendaText} numberOfLines={2}>{m.minutes}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.viewLink}>Read minutes →</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* Open positions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Open positions</Text>
            {user.membershipStatus === 'active' && (
              <TouchableOpacity onPress={() => navigation.navigate('ApplyLeadership')}>
                <Text style={styles.cardLink}>Apply →</Text>
              </TouchableOpacity>
            )}
          </View>

          {user.membershipStatus !== 'active' && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Leadership applications are available to <Text style={styles.noticeStrong}>active members</Text>.
                Your current status: {user.membershipStatus}.
              </Text>
            </View>
          )}

          {openPositions.length === 0 ? (
            <Text style={styles.emptyText}>No positions open right now.</Text>
          ) : (
            openPositions.map((p) => (
              <View key={p.id} style={styles.position}>
                <View style={styles.positionHeader}>
                  <Text style={styles.positionTitle}>{p.title}</Text>
                  <View style={styles.openBadge}>
                    <Text style={styles.openBadgeText}>Open</Text>
                  </View>
                </View>
                <Text style={styles.positionDesc}>{p.description}</Text>
                {user.membershipStatus === 'active' && (
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() =>
                      navigation.navigate('ApplyLeadership', { positionId: p.id })
                    }
                  >
                    <Text style={styles.applyBtnText}>Apply for this role</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

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
  topBarRight: { width: 40 },

  body: { padding: 16 },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  cardLink: { fontSize: 13, color: colors.primary, fontWeight: '700', marginBottom: 12 },

  /* Leadership list */
  leaderList: { gap: 12 },
  leaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  leaderAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  leaderAvatarText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  leaderRole: { fontSize: 11, color: colors.primaryDark, fontWeight: '600', marginTop: 2 },
  leaderBio: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },

  /* Meetings */
  meeting: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  meetingPast: { opacity: 0.7 },
  subhead: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  viewLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 8,
  },
  meetingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  meetingTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  meetingDate: { fontSize: 11, color: colors.primaryDark, fontWeight: '700' },
  meetingMeta: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  agenda: { marginTop: 8, backgroundColor: colors.background, padding: 8, borderRadius: 8 },
  agendaLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  agendaText: { fontSize: 12, color: colors.textPrimary, lineHeight: 17 },

  /* Positions */
  position: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  positionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  positionTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  openBadge: { backgroundColor: colors.greenLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  openBadgeText: { fontSize: 10, fontWeight: '700', color: colors.statusAcceptedText },
  positionDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: 10 },
  applyBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyBtnText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },

  notice: {
    backgroundColor: colors.statusReviewBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  noticeText: { fontSize: 12, color: colors.statusReviewText, lineHeight: 17 },
  noticeStrong: { fontWeight: '700' },

  emptyText: { fontSize: 13, color: colors.textSecondary },
});