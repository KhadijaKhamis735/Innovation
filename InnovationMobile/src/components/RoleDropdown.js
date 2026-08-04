import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../styles/colors';

// RoleDropdown
// ------------
// Account-type picker for the unified Register screen. Lists the
// four roles the system recognises today:
//   - 'innovator'     → /api/mobile/auth/register
//   - 'funder'        → /api/mobile/auth/register
//   - 'club_member'   → /api/mobile/club/auth/register (member table)
//   - 'club_leader'   → /api/mobile/club/auth/register (member table;
//     leaders are admin-created per Phase 6B, so this is a cosmetic
//     option that mirrors the web's unified AuthPage dropdown).
//
// For four items a popover + checkmark is cleaner than a wheel
// picker. If the list ever grows past ~6, switch to a real picker.

const OPTIONS = [
  {
    key: 'innovator',
    label: 'Innovator',
    hint: 'Submit and run innovation projects.',
  },
  {
    key: 'funder',
    label: 'Funder (Organization)',
    hint: 'Post funding opportunities and review applicants.',
  },
  {
    key: 'club_member',
    label: 'Club Member',
    hint: 'Join your university innovation club (verified by a Club Leader).',
  },
  {
    key: 'club_leader',
    label: 'Club Leader (Mlezi)',
    hint: 'Lead a university branch and verify members.',
  },
];

export default function RoleDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.key === value);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>I am registering as *</Text>

      <TouchableOpacity
        style={styles.field}
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Account type"
        accessibilityHint="Opens a list of account types"
      >
        <Text style={[styles.fieldText, !current && styles.fieldPlaceholder]}>
          {current ? current.label : 'Select account type'}
        </Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Dismiss role picker"
        >
          <Pressable style={styles.popover} onPress={() => {}}>
            <Text style={styles.popoverTitle}>Choose account type</Text>
            {OPTIONS.map((opt) => {
              const selected = opt.key === value;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.option, selected && styles.optionSelected]}
                  activeOpacity={0.85}
                  onPress={() => {
                    onChange(opt.key);
                    setOpen(false);
                  }}
                >
                  <View style={styles.optionRow}>
                    <Text
                      style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {selected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <Text style={styles.optionHint}>{opt.hint}</Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  fieldText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  fieldPlaceholder: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  chevron: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },

  // Modal + popover
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popover: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  popoverTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  option: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.primaryDark,
  },
  checkmark: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  optionHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
});