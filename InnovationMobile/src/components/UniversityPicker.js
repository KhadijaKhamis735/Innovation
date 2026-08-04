import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../styles/colors';

// UniversityPicker
// -----------------
// Card grid picker for the 4 universities returned by
// GET /api/club/auth/universities. Each card shows the short name,
// full name, and the primaryColor from the backend so the picker
// feels branded without hard-coding it client-side.
//
// On change: emits the selected university's `id` (Long from
// backend) so the parent can post it directly to
// /api/mobile/club/auth/register.
//
// Required props:
//   - universities: Array<{ id, name, shortName, regNumberPrefix,
//                          primaryColor, tagline }>
//   - value: Long | null   — currently selected university id
//   - onChange: (id: Long) => void

export default function UniversityPicker({ universities, value, onChange }) {
  if (!universities || universities.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Loading universities…</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {universities.map((u) => {
        const selected = u.id === value;
        // Fall back to a neutral border if the backend ever returns a
        // primary color we can't use — keeps the UI usable even on
        // bad data.
        const accent = u.primaryColor || colors.primary;
        return (
          <TouchableOpacity
            key={u.id}
            activeOpacity={0.85}
            onPress={() => onChange(u.id)}
            style={[
              styles.card,
              { borderColor: selected ? accent : colors.border },
              selected && { backgroundColor: hexWithAlpha(accent, 0.08) },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Select university ${u.name}`}
            accessibilityState={{ selected }}
          >
            <View
              style={[
                styles.badge,
                { backgroundColor: hexWithAlpha(accent, 0.18) },
              ]}
            >
              <Text style={[styles.badgeText, { color: accent }]}>
                {u.shortName}
              </Text>
            </View>
            <Text
              style={[styles.name, selected && { color: accent }]}
              numberOfLines={2}
            >
              {u.name}
            </Text>
            {u.tagline ? (
              <Text style={styles.tagline} numberOfLines={1}>
                {u.tagline}
              </Text>
            ) : null}
            {selected ? (
              <View style={[styles.check, { backgroundColor: accent }]}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// "#f97316" → "rgba(249, 115, 22, 0.08)" without pulling in a color
// library. Mirrors the helper used in LandingScreen.js.
function hexWithAlpha(hex, alpha) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return `rgba(249, 115, 22, ${alpha})`;
  }
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(249, 115, 22, ${alpha})`;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    minHeight: 96,
    justifyContent: 'flex-start',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  tagline: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  empty: {
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});