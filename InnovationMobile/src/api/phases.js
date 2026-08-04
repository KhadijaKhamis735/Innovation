// ─────────────────────────────────────────────────────────────
// api/phases.js
// ─────────────────────────────────────────────────────────────
// Single source of truth for canonical project-phase labels and
// colours on the mobile client.
//
// Backend contract (ProjectPhase enum, lowercase JSON):
//   idea | proposal | prototype | mvp | scaling
//
// All screens that render project phase (MyProjectsScreen,
// InnovationProjectDetailScreen) should look up their label +
// colors here rather than hard-coding strings — keeps cross-
// client parity with the React web app's phase vocabulary.
// ─────────────────────────────────────────────────────────────

/** Backend enum value → human label for surfaces. */
export const PHASE_LABELS = {
  idea:      'Idea',
  proposal:  'Proposal',
  prototype: 'Prototype',
  mvp:       'MVP',
  scaling:   'Scaling',
};

/** Canonical list, useful for chips and phase-progress ordering. */
export const PHASE_ORDER = [
  'idea',
  'proposal',
  'prototype',
  'mvp',
  'scaling',
];

/** Per-phase UI palette (background + text colour). */
export const PHASE_PALETTE = {
  idea:      { bg: '#e0f2fe', color: '#0284c7' },
  proposal:  { bg: '#fef3c7', color: '#d97706' },
  prototype: { bg: '#f3e8ff', color: '#7c3aed' },
  mvp:       { bg: '#dcfce7', color: '#16a34a' },
  scaling:   { bg: '#ffedd5', color: '#ea580c' },
};

/** Project approval status colours (admin-controlled on the backend). */
export const APPROVAL_PALETTE = {
  pending:  { bg: 'rgba(245, 158, 11, 0.12)', color: '#b45309' },
  approved: { bg: 'rgba(34, 197, 94, 0.12)',  color: '#15803d' },
  rejected: { bg: 'rgba(239, 68, 68, 0.12)',  color: '#b91c1c' },
};

/**
 * Map a backend phase to its display label. Falls back to the raw
 * value so a future backend phase never silently disappears from
 * the UI.
 */
export function phaseLabel(phase) {
  if (!phase) return '—';
  return PHASE_LABELS[phase] ?? phase;
}

/**
 * Map a backend phase to a (background, color) palette pair.
 * The same `bg` + `color` keys are used by every phase chip so
 * callers can spread the result into a single style object.
 */
export function phasePalette(phase) {
  return PHASE_PALETTE[phase] ?? { bg: '#e2e8f0', color: '#475569' };
}

/** Map an approval status to its (background, color) pair. */
export function approvalPalette(status) {
  return APPROVAL_PALETTE[status] ?? { bg: '#e2e8f0', color: '#475569' };
}

/** True when `phase` is one of the 5 backend-canonical values. */
export function isValidPhase(phase) {
  return PHASE_ORDER.includes(phase);
}
