import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../../styles/colors';
import { useApp } from '../../context/AppContext';
import ActivityCard from '../../components/club/ActivityCard';
import Sidebar from '../../components/Sidebar';

// ClubActivitiesScreen
// --------------------
// Lists every club activity with two filters:
//   - Type filter chips (Workshop, Hackathon, …)
//   - Free-text search across title + description
// Tapping a card opens ActivityDetailScreen. Cards already show
// registration status by reading activityParticipations from context.

export default function ClubActivitiesScreen({ navigation }) {
  const { activities, activityParticipations } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('clubActivities');
  const [type, setType] = useState('All');
  const [q, setQ] = useState('');
  const { height: windowHeight } = useWindowDimensions();

  // Derive filter chips from the actual activity list, so a new type
  // added to seed data shows up automatically.
  const typeOptions = useMemo(() => {
    const set = new Set(activities.map((a) => a.type));
    return ['All', ...Array.from(set)];
  }, [activities]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return activities.filter((a) => {
      if (type !== 'All' && a.type !== type) return false;
      if (!query) return true;
      return (
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      );
    });
  }, [activities, type, q]);

  const isRegistered = (id) => activityParticipations.some((p) => p.activityId === id);

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
          <Text style={styles.pageTitle}>Club Activities</Text>
          <Text style={styles.pageSubtitle}>{filtered.length} of {activities.length} shown</Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      <View style={styles.filterBar}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.search}
            placeholder="Search activities…"
            placeholderTextColor={colors.textMuted}
            value={q}
            onChangeText={setQ}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {typeOptions.map((t) => {
            const active = t === type;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ height: windowHeight - 160 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator
        alwaysBounceVertical
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyText}>No activities match your filters.</Text>
          </View>
        ) : (
          filtered.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              registered={isRegistered(a.id)}
              onPress={() =>
                navigation.navigate('ActivityDetail', { activityId: a.id })
              }
            />
          ))
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
  topBarRight: { width: 40 },

  filterBar: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  search: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipsRow: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.white },

  body: { padding: 16 },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 13, color: colors.textSecondary },
});