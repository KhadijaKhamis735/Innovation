// ─────────────────────────────────────────────────────────────
// __tests__/api/projects.test.js
// ─────────────────────────────────────────────────────────────
// Phase 7 — pin the helper logic that builds clean request bodies
// from form state. The backend rejects empty strings for optional
// fields via @Size constraints; these helpers strip blanks so the
// form-round-trip never trips validation.
// ─────────────────────────────────────────────────────────────
import {
  toCreateBody,
  toUpdateBody,
  toMilestoneBody,
  classifyProjectError,
} from '../../src/api/projects';
import { ApiError } from '../../src/api/client';

describe('projects.toCreateBody', () => {
  test('keeps required name, default phase, drops blank optionals', () => {
    const body = toCreateBody({
      name: 'Solar Cooler',
      tagline: '  ',
      description: '',
      category: undefined,
      tags: '',
      milestones: [{ name: '' }, { name: '  First prototype  ' }],
    });
    expect(body.name).toBe('Solar Cooler');
    expect(body.phase).toBe('idea');
    expect(body.tagline).toBeUndefined();
    expect(body.description).toBeUndefined();
    expect(body.category).toBeUndefined();
    expect(body.tags).toBeUndefined();
    expect(body.milestones).toEqual([
      { name: 'First prototype' },
    ]);
  });

  test('parses comma-separated tags and caps at 20', () => {
    const body = toCreateBody({
      name: 'X',
      tags: ' a, b ,c, d, e',
    });
    expect(body.tags).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  test('preserves an array of tags', () => {
    const body = toCreateBody({ name: 'X', tags: ['alpha', 'beta'] });
    expect(body.tags).toEqual(['alpha', 'beta']);
  });

  test('normalises YYYY-MM-DD start dates to the same shape', () => {
    const body = toCreateBody({ name: 'X', startDate: '2026-01-15' });
    expect(body.startDate).toBe('2026-01-15');
  });
});

describe('projects.toUpdateBody', () => {
  test('always sends tags (empty array clears)', () => {
    const body = toUpdateBody({ name: 'X', tags: '' });
    expect(body.tags).toEqual([]);
  });

  test('keeps name required', () => {
    const body = toUpdateBody({ name: 'X' });
    expect(body.name).toBe('X');
  });
});

describe('projects.toMilestoneBody', () => {
  test('omits blank name and description', () => {
    const body = toMilestoneBody({ name: '  ', description: '' });
    expect(body.name).toBeUndefined();
    expect(body.description).toBeUndefined();
  });

  test('always echoes completed boolean', () => {
    expect(toMilestoneBody({ name: '  A  ', completed: true }).completed).toBe(true);
    expect(toMilestoneBody({ name: 'A', completed: false }).completed).toBe(false);
  });

  test('honours completedDate when set', () => {
    const body = toMilestoneBody({ name: 'A', completedDate: '2026-02-01' });
    expect(body.completedDate).toBe('2026-02-01');
  });

  test('nulls completedDate when the user clears it', () => {
    const body = toMilestoneBody({ name: 'A', completedDate: null });
    expect(body.completedDate).toBeNull();
  });
});

describe('projects.classifyProjectError', () => {
  test('maps 0 to network', () => {
    expect(classifyProjectError(new ApiError({ status: 0, message: 'down' })).kind)
      .toBe('network');
  });

  test('maps 401 to unauthorized', () => {
    expect(classifyProjectError(new ApiError({ status: 401, message: 'no' })).kind)
      .toBe('unauthorized');
  });

  test('maps 403 with "verify" prefix to verification', () => {
    expect(classifyProjectError(
      new ApiError({ status: 403, message: 'Please verify your email' })
    ).kind).toBe('verification');
  });

  test('maps 404 to not_found', () => {
    expect(classifyProjectError(new ApiError({ status: 404, message: 'gone' })).kind)
      .toBe('not_found');
  });

  test('maps 413/422 with "limit" wording to limit_exceeded', () => {
    expect(classifyProjectError(
      new ApiError({ status: 413, message: 'File exceeds limit' })
    ).kind).toBe('limit_exceeded');
    expect(classifyProjectError(
      new ApiError({ status: 422, message: 'Maximum attachments reached' })
    ).kind).toBe('limit_exceeded');
  });

  test('maps 5xx to server', () => {
    expect(classifyProjectError(new ApiError({ status: 500, message: 'boom' })).kind)
      .toBe('server');
  });
});
