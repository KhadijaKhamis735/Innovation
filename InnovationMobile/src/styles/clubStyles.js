// Shared style helpers for the Club module.
// Keep this file small — most screens should still have their own
// StyleSheet at the bottom. Use this only for tokens reused by
// 2+ club screens (badges, status pills, common card chrome).

import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const clubStyles = StyleSheet.create({
  // Membership status pill — used by ClubMembershipScreen and Sidebar.
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusActive: { backgroundColor: colors.greenLight },
  statusActiveText: { color: colors.statusAcceptedText },
  statusPending: { backgroundColor: colors.statusReviewBg },
  statusPendingText: { color: colors.statusReviewText },
  statusNone: { backgroundColor: colors.border },
  statusNoneText: { color: colors.textSecondary },

  // Generic section card chrome.
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
});
