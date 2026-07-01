import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  SafeAreaView,
} from 'react-native';
import { colors } from '../../styles/colors';
import { useApp } from '../../context/AppContext';

// MeetingDetailScreen
// --------------------
// Opens from ClubLeadershipScreen when a meeting is tapped.
//
// Layout:
//   - Header (title, date, time, location)
//   - Primary CTA: "Join meeting" if meetingLink exists (opens
//     Google Meet / Zoom via Linking). Disabled with a label
//     explaining why if not.
//   - Agenda (always shown)
//   - Minutes (only for past meetings where the leadership has
//     recorded them; seed data includes one example)

const formatDateLong = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
};

const isPast = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  // Treat a meeting as past if its date is before today's start.
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
};

// Detect common meeting providers so we can show the right label
// on the join button ("Join Google Meet" vs "Join Zoom" vs "Join meeting").
const detectProvider = (url) => {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('meet.google.com')) return 'Google Meet';
  if (u.includes('zoom.us') || u.includes('zoom.com')) return 'Zoom';
  if (u.includes('teams.microsoft.com') || u.includes('teams.live.com')) return 'Microsoft Teams';
  if (u.includes('webex')) return 'Webex';
  return 'meeting';
};

export default function MeetingDetailScreen({ navigation, route }) {
  const { meetingId } = route.params || {};
  const { meetings } = useApp();

  // Bump this whenever the user does something locally that should
  // re-render (e.g. a future "I attended" toggle).
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const meeting = meetings.find((m) => m.id === meetingId);
  if (!meeting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.topBarCenter}><Text style={styles.pageTitle}>Meeting</Text></View>
          <View style={styles.topBarRight} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Meeting not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const past = isPast(meeting.date);
  const provider = detectProvider(meeting.meetingLink);

  const handleJoin = async () => {
    if (!meeting.meetingLink) return;
    try {
      const can = await Linking.canOpenURL(meeting.meetingLink);
      if (can) {
        await Linking.openURL(meeting.meetingLink);
      } else {
        Alert.alert(
          'Cannot open link',
          `Your device can't open ${meeting.meetingLink}. Try copying it into your browser.`,
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open the meeting link.');
    }
    rerender();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.pageTitle} numberOfLines={1}>Meeting</Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, past ? styles.statusPillPast : styles.statusPillUpcoming]}>
              <Text style={[styles.statusPillText, past ? styles.statusPillTextPast : styles.statusPillTextUpcoming]}>
                {past ? 'Past' : 'Upcoming'}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{meeting.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>📅 Date</Text>
            <Text style={styles.metaValue}>{formatDateLong(meeting.date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>⏰ Time</Text>
            <Text style={styles.metaValue}>{meeting.time}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>📍 Location</Text>
            <Text style={styles.metaValue}>{meeting.location}</Text>
          </View>
        </View>

        {/* Join meeting CTA — only when the meeting has a link */}
        <View style={styles.card}>
          {meeting.meetingLink ? (
            <>
              <Text style={styles.cardTitle}>Join the meeting</Text>
              <Text style={styles.cardSubtitle}>
                Tap below to open {provider} in your browser or meeting app.
              </Text>
              <TouchableOpacity
                style={[styles.joinBtn, past && styles.joinBtnPast]}
                onPress={handleJoin}
              >
                <Text style={styles.joinBtnIcon}>🎥</Text>
                <Text style={[styles.joinBtnText, past && styles.joinBtnTextPast]}>
                  {past
                    ? `Open ${provider} recording link`
                    : `Join ${provider} meeting`}
                </Text>
              </TouchableOpacity>
              <Text style={styles.linkHint} numberOfLines={1}>{meeting.meetingLink}</Text>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>No online link</Text>
              <Text style={styles.cardSubtitle}>
                This meeting is in-person only. See the location above.
              </Text>
            </>
          )}
        </View>

        {/* Agenda */}
        {meeting.agenda ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Agenda</Text>
            <Text style={styles.agendaText}>{meeting.agenda}</Text>
          </View>
        ) : null}

        {/* Minutes — only for past meetings */}
        {past && meeting.minutes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Meeting minutes</Text>
            <Text style={styles.minutesText}>{meeting.minutes}</Text>
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

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
  backIcon: { fontSize: 24, color: colors.textSecondary, marginTop: -2 },
  topBarCenter: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  topBarRight: { width: 40 },

  body: { padding: 16, paddingBottom: 32 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: colors.textSecondary, fontSize: 14 },

  /* Header */
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  statusRow: { flexDirection: 'row', marginBottom: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillUpcoming: { backgroundColor: colors.greenLight },
  statusPillPast:     { backgroundColor: colors.border },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  statusPillTextUpcoming: { color: colors.statusAcceptedText },
  statusPillTextPast:     { color: colors.textSecondary },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 12, letterSpacing: -0.3 },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border,
  },
  metaLabel: { fontSize: 12, color: colors.textSecondary },
  metaValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 12 },

  /* Cards */
  card: {
    backgroundColor: colors.white,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  cardSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: 12 },

  /* Join button */
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 14, borderRadius: 12,
    shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 3,
  },
  joinBtnPast: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, shadowOpacity: 0, elevation: 0 },
  joinBtnIcon: { fontSize: 18 },
  joinBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  joinBtnTextPast: { color: colors.textPrimary },
  linkHint: { fontSize: 11, color: colors.textMuted, marginTop: 10, textAlign: 'center' },

  /* Agenda / minutes */
  agendaText: { fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  minutesText: { fontSize: 13, color: colors.textPrimary, lineHeight: 20, fontStyle: 'italic' },
});