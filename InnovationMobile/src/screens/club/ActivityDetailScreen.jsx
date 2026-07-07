import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import { colors } from '../../styles/colors';
import { useApp } from '../../context/AppContext';
import Sidebar from '../../components/Sidebar';

// ActivityDetailScreen
// --------------------
// Receives { activityId } via route params. Shows the full event
// description, date/time, location or online link, capacity, and
// a primary CTA that toggles between "Register" and "Cancel
// registration" using the context's registerForActivity().
//
// Non-club-members are still allowed to *view* the activity (so
// they can decide to join the club), but the CTA gates them into
// the registration flow.

const formatDateLong = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

export default function ActivityDetailScreen({ navigation, route }) {
  const { activityId } = route.params || {};
  const { activities, activityParticipations, registerForActivity, isClubMember, user } = useApp();

  const activity = activities.find((a) => a.id === activityId);
  // useState so the registered state is locally re-renderable; the
  // underlying context value stays the source of truth.
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('clubActivities');

  if (!activity) {
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
          <View style={styles.topBarCenter}><Text style={styles.pageTitle}>Activity</Text></View>
          <View style={styles.topBarRight} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Activity not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const alreadyRegistered = activityParticipations.some(
    (p) => p.activityId === activity.id && p.userId === user.id,
  );
  const full = activity.capacity - activity.registered <= 0;

  const handleRegister = () => {
    if (!isClubMember) {
      Alert.alert(
        'Join the club first',
        'You need to be a club member to register for activities.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Join now', onPress: () => navigation.navigate('ClubRegistration') },
        ],
      );
      return;
    }
    registerForActivity(activity.id);
    rerender();
    Alert.alert('You\'re in!', `See you at "${activity.title}".`);
  };

  const handleCancel = () => {
    // Removing requires a context action we didn't expose in v1; for
    // now we just inform. (Easy to add `cancelActivityRegistration`
    // when needed — the screen is already wired to react.)
    Alert.alert(
      'Cancellation',
      'Cancellation flow is handled by your club admin. Reach out to leadership.',
    );
  };

  const handleOpenLink = async () => {
    if (!activity.onlineLink) return;
    try {
      const can = await Linking.canOpenURL(activity.onlineLink);
      if (can) await Linking.openURL(activity.onlineLink);
      else Alert.alert('Cannot open link', activity.onlineLink);
    } catch (err) {
      Alert.alert('Error', 'Could not open the link.');
    }
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
          <Text style={styles.pageTitle} numberOfLines={1}>Activity</Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{activity.type}</Text>
        </View>

        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.desc}>{activity.description}</Text>

        {/* Meta block */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>📅 Date</Text>
            <Text style={styles.metaValue}>{formatDateLong(activity.date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>⏰ Time</Text>
            <Text style={styles.metaValue}>{activity.time}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>📍 Location</Text>
            <Text style={styles.metaValue}>
              {activity.isOnline ? 'Online' : activity.location || 'TBA'}
            </Text>
          </View>
          {activity.isOnline && (
            <TouchableOpacity style={styles.linkRow} onPress={handleOpenLink}>
              <Text style={styles.metaLabel}>🔗 Meeting link</Text>
              <Text style={styles.linkText} numberOfLines={1}>{activity.onlineLink}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>👥 Capacity</Text>
            <Text style={styles.metaValue}>
              {activity.registered} / {activity.capacity}
            </Text>
          </View>
        </View>

        {/* Capacity bar */}
        <View style={styles.capacityBarTrack}>
          <View
            style={[
              styles.capacityBarFill,
              { width: `${Math.min(100, (activity.registered / activity.capacity) * 100)}%` },
              full && styles.capacityBarFull,
            ]}
          />
        </View>

        {/* Status + CTA */}
        <View style={styles.cta}>
          {alreadyRegistered ? (
            <>
              <View style={styles.successBadge}>
                <Text style={styles.successBadgeText}>✓ You're registered</Text>
              </View>
              <TouchableOpacity
                style={[styles.ctaBtn, styles.ctaBtnSecondary]}
                onPress={handleCancel}
              >
                <Text style={styles.ctaBtnTextSecondary}>Need to cancel?</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.ctaBtn, full && styles.ctaBtnDisabled]}
              onPress={handleRegister}
              disabled={full}
            >
              <Text style={styles.ctaBtnText}>
                {full ? 'Activity is full' : isClubMember ? 'Register for this activity' : 'Join the club to register'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
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

  body: { padding: 16, paddingBottom: 40 },

  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },

  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, letterSpacing: -0.3 },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginBottom: 16 },

  metaCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metaLabel: { fontSize: 12, color: colors.textSecondary },
  metaValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 12 },

  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },

  capacityBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: 12,
  },
  capacityBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  capacityBarFull: { backgroundColor: colors.error },

  cta: { marginTop: 24 },
  ctaBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaBtnDisabled: { backgroundColor: colors.border },
  ctaBtnSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  ctaBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  ctaBtnTextSecondary: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },

  successBadge: {
    backgroundColor: colors.greenLight,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  successBadgeText: { color: colors.statusAcceptedText, fontWeight: '700', fontSize: 14 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
});