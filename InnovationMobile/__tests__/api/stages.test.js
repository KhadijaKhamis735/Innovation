// ─────────────────────────────────────────────────────────────
// __tests__/api/stages.test.js
// ─────────────────────────────────────────────────────────────
// Phase 7 — guard the canonical stage vocabulary. The shared
// STAGE_ORDER array is the source of truth for every UI surface
// (mobile + web). Any drift here will silently break filter chips
// and dashboards. These tests pin the contract.
// ─────────────────────────────────────────────────────────────
import { STAGE_ORDER, PENDING_STAGES, PAST_STAGES, stageLabel } from '../../src/api/stages';

describe('stages', () => {
  test('STAGE_ORDER is the canonical seven', () => {
    expect(STAGE_ORDER).toEqual([
      'submitted',
      'under_review',
      'interview',
      'pitch',
      'shortlisted',
      'accepted',
      'rejected',
    ]);
  });

  test('PENDING_STAGES excludes terminal stages', () => {
    expect(PENDING_STAGES.has('accepted')).toBe(false);
    expect(PENDING_STAGES.has('rejected')).toBe(false);
    expect(PENDING_STAGES.has('under_review')).toBe(true);
    expect(PENDING_STAGES.has('interview')).toBe(true);
  });

  test('PAST_STAGES is exactly the terminal two', () => {
    expect([...PAST_STAGES].sort()).toEqual(['accepted', 'rejected']);
  });

  test('stageLabel returns a human-readable string for every stage', () => {
    for (const stage of STAGE_ORDER) {
      const label = stageLabel(stage);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      // Label should not be the raw underscored stage.
      expect(label).not.toBe(stage);
    }
  });

  test('stageLabel falls back to the raw key for unknown stages', () => {
    expect(stageLabel('not-a-real-stage')).toBe('not-a-real-stage');
  });
});
