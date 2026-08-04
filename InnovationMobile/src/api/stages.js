// ─────────────────────────────────────────────────────────────
// api/stages.js
// ─────────────────────────────────────────────────────────────
// Single source of truth for canonical application-stage labels
// and colors on the mobile client.
//
// Backend contract (Opportunity/Application backend):
//   submitted | under_review | interview | pitch |
//   shortlisted | accepted | rejected
//
// All screens that render application stage (MyApplications,
// InnovatorDashboard) should look up their label + colors here
// rather than hard-coding strings — keeps cross-client parity
// with the React web app's stage vocabulary.
// ─────────────────────────────────────────────────────────────
import { colors } from '../styles/colors';

/** Backend enum value → human label for surfaces. */
export const STAGE_LABELS = {
  submitted:    'Submitted',
  under_review: 'Under Review',
  interview:    'Interview',
  pitch:        'Pitch',
  shortlisted:  'Shortlisted',
  accepted:     'Accepted',
  rejected:     'Rejected',
};

/** Canonical list, useful for tabs / filter chips / sort orders. */
export const STAGE_ORDER = [
  'submitted',
  'under_review',
  'interview',
  'pitch',
  'shortlisted',
  'accepted',
  'rejected',
];

/** Stages the innovator still waits on (used for the Pending tab). */
export const PENDING_STAGES = new Set([
  'submitted',
  'under_review',
  'interview',
  'pitch',
  'shortlisted',
]);

/** Stages the innovator considers a final outcome. */
export const PAST_STAGES = new Set(['accepted', 'rejected']);

/**
 * Map a backend stage to its display label. Falls back to the raw
 * string so a future backend stage never silently disappears from
 * the UI.
 */
export function stageLabel(stage) {
  if (!stage) return '—';
  return STAGE_LABELS[stage] ?? stage;
}

/**
 * Map a backend stage to a (background, text) color pair sourced from
 * the existing mobile palette so the badge styling matches the rest
 * of the app.
 */
export function stagePalette(stage) {
  switch (stage) {
    case 'submitted':
      return { bg: colors.statusSubmittedBg, text: colors.statusSubmittedText };
    case 'under_review':
      return { bg: colors.statusReviewBg, text: colors.statusReviewText };
    case 'interview':
    case 'pitch':
    case 'shortlisted':
      return { bg: '#fff7ed', text: '#c2410c' }; // warm amber for in-progress
    case 'accepted':
      return { bg: colors.statusAcceptedBg, text: colors.statusAcceptedText };
    case 'rejected':
      return { bg: colors.statusRejectedBg, text: colors.statusRejectedText };
    default:
      return { bg: colors.border, text: colors.textSecondary };
  }
}
