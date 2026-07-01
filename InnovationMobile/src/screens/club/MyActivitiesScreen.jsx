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
import ActivityCard from '../../components/club/ActivityCard';
import Sidebar from '../../components/Sidebar';

// MyActivitiesScreen
// ------------------
// Two-section list of activities the user joined:
//   - Upcoming (date >= today)
//   - Past      (date <  today)
// Reads both `activities` and `activityParticipations` from context
// so it stays in sync with registrations done elsewhere.

export default function MyActivitiesScreen({ navigation }) {
  const { activities, activityParticipations, user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('myActivities');
  const { height: windowHeight } = useWindowDimensions();

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const joined = activities.filter((a) =>
      activityParticipations.some((p) => p.activityId === a.id && p.userId === user.id),
    );
    const up = [];
    const pa = [];
    joined.forEach((a) => {
      const t = new Date(a.date).getTime();
      if (t >= now) up.push(a);
      else pa.push(a);
    });
    // Upcoming: nearest first. Past: most recent first.
    up.sort((a, b) => new Date(a.date) - new Date(b.date));
    pa.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { upcoming: up, past: pa };
  }, [activities, activityParticipations, user.id]);

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
          <Text style={styles.pageTitle}>My Activities</Text>
          <Text style={styles.pageSubtitle}>
            {upcoming.length} upcoming · {past.length} attended
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
        {upcoming.length === 0 && past.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptyText}>
              Browse club activities and register for the ones you want to attend.
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => navigation.navigate('ClubActivities')}
            >
              <Text style={styles.btnText}>Browse activities</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {upcoming.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                registered
                onPress={() => navigation.navigate('ActivityDetail', { activityId: a.id })}
              />
            ))}
          </View>
        )}

        {past.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past activities</Text>
            {past.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                registered
                past
                onPress={() => navigation.navigate('ActivityDetail', { activityId: a.id })}
              />
            ))}
          </View>
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

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },

  empty: { alignItems: 'center', paddingVertical: 56, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 8 },
  btn: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});