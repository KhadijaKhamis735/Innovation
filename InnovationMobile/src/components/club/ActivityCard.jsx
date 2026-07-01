import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../styles/colors';

// ActivityCard
// ------------
// Reusable list item used by:
//   - ClubActivitiesScreen (browse)
//   - MyActivitiesScreen   (upcoming + past)
//
// Keeps the visual contract (badges, capacity bar) consistent so the
// user recognizes an activity card whether they came from the directory
// or from their personal list.

const TYPE_COLORS = {
  Workshop:       { bg: colors.blueLight,       fg: colors.blue },
  Hackathon:      { bg: colors.primaryLight,    fg: colors.primaryDark },
  'Pitch Practice': { bg: colors.purpleLight,   fg: colors.purple },
  'Demo Day':     { bg: colors.greenLight,      fg: colors.statusAcceptedText },
  Seminar:        { bg: colors.statusReviewBg,  fg: colors.statusReviewText },
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function ActivityCard({ activity, onPress, registered, past }) {
  const palette = TYPE_COLORS[activity.type] || { bg: colors.border, fg: colors.textSecondary };
  const seatsLeft = Math.max(0, activity.capacity - activity.registered);
  const full = seatsLeft === 0;

  return (
    <TouchableOpacity
      style={[styles.card, past && styles.cardPast]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: palette.bg }]}>
          <Text style={[styles.typeBadgeText, { color: palette.fg }]}>{activity.type}</Text>
        </View>
        {registered && (
          <View style={styles.registeredBadge}>
            <Text style={styles.registeredBadgeText}>✓ Registered</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>{activity.title}</Text>
      <Text style={styles.desc} numberOfLines={2}>{activity.description}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>📅 {formatDate(activity.date)}</Text>
        <Text style={styles.meta}>⏰ {activity.time}</Text>
      </View>

      <View style={styles.metaRow}>
        {activity.isOnline ? (
          <Text style={styles.meta}>💻 Online event</Text>
        ) : (
          <Text style={styles.meta} numberOfLines={1}>📍 {activity.location}</Text>
        )}
      </View>

      {/* Capacity bar — mirrors web .capacity-fill */}
      <View style={styles.capacityRow}>
        <Text style={styles.capacityText}>
          {activity.registered} / {activity.capacity} registered
        </Text>
        <View style={styles.capacityBarTrack}>
          <View
            style={[
              styles.capacityBarFill,
              { width: `${Math.min(100, (activity.registered / activity.capacity) * 100)}%` },
              full && styles.capacityBarFull,
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPast: { opacity: 0.65 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  registeredBadge: {
    backgroundColor: colors.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  registeredBadgeText: { fontSize: 10, fontWeight: '700', color: colors.statusAcceptedText },

  title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  desc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: 10 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  meta: { fontSize: 11, color: colors.textSecondary },

  capacityRow: { marginTop: 10 },
  capacityText: { fontSize: 10, color: colors.textMuted, marginBottom: 5 },
  capacityBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  capacityBarFull: { backgroundColor: colors.error },
});