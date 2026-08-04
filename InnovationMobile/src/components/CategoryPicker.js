import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../styles/colors';

// CategoryPicker
// --------------
// Card grid for the 4 club-member categories. Mirrors the web
// AuthPage tab (MemberCategory enum: student | staff | alumni | corporate).
//
// Required props:
//   - value: 'student' | 'staff' | 'alumni' | 'corporate' | null
//   - onChange: (key) => void

const OPTIONS = [
  {
    key: 'student',
    label: 'Student',
    emoji: '🎓',
    hint: 'Currently enrolled at a university.',
  },
  {
    key: 'staff',
    label: 'Staff',
    emoji: '👩‍🏫',
    hint: 'University faculty or staff.',
  },
  {
    key: 'alumni',
    label: 'Alumni',
    emoji: '🎓',
    hint: 'Graduated — still part of the network.',
  },
  {
    key: 'corporate',
    label: 'Corporate',
    emoji: '🏢',
    hint: 'External partner or sponsor.',
  },
];

export default function CategoryPicker({ value, onChange }) {
  return (
    <View style={styles.grid}>
      {OPTIONS.map((opt) => {
        const selected = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            activeOpacity={0.85}
            onPress={() => onChange(opt.key)}
            style={[
              styles.card,
              selected && styles.cardSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Select ${opt.label}`}
            accessibilityState={{ selected }}
          >
            <View style={styles.row}>
              <Text style={styles.emoji}>{opt.emoji}</Text>
              <Text
                style={[
                  styles.label,
                  selected && styles.labelSelected,
                ]}
              >
                {opt.label}
              </Text>
              {selected ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <Text style={styles.hint}>{opt.hint}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
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
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emoji: {
    fontSize: 18,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  labelSelected: {
    color: colors.primaryDark,
  },
  check: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
});