// ─────────────────────────────────────────────────────────────
// __tests__/api/users.test.js
// ─────────────────────────────────────────────────────────────
// Phase 7 — pin the contract for the users API + error classifier.
// Run with `npm test` from InnovationMobile/.
// ─────────────────────────────────────────────────────────────
import { classifyProfileError, usersApi } from '../../src/api/users';
import { ApiError } from '../../src/api/client';

describe('usersApi.classifyProfileError', () => {
  test('returns network on status 0', () => {
    expect(classifyProfileError(new ApiError({ status: 0, message: 'down' })))
      .toEqual({ kind: 'network' });
  });

  test('returns unauthorized on 401', () => {
    expect(classifyProfileError(new ApiError({ status: 401, message: 'bad token' })))
      .toEqual({ kind: 'unauthorized' });
  });

  test('returns forbidden on 403', () => {
    const r = classifyProfileError(new ApiError({ status: 403, message: 'nope' }));
    expect(r.kind).toBe('forbidden');
    expect(r.message).toBe('nope');
  });

  test('returns validation on 400 / 422', () => {
    expect(classifyProfileError(new ApiError({ status: 400, message: 'firstName required' })).kind)
      .toBe('validation');
    expect(classifyProfileError(new ApiError({ status: 422, message: 'too long' })).kind)
      .toBe('validation');
  });

  test('returns server on 5xx', () => {
    const r = classifyProfileError(new ApiError({ status: 500, message: 'boom' }));
    expect(r.kind).toBe('server');
    expect(r.message).toBe('boom');
  });

  test('returns unknown for non-ApiError', () => {
    const r = classifyProfileError(new Error('whatever'));
    expect(r.kind).toBe('unknown');
    expect(r.message).toBe('whatever');
  });
});

describe('usersApi.updateMe', () => {
  beforeEach(() => {
    // Each test pins its own fetch response; reset to avoid bleed.
    global.fetch = jest.fn();
  });

  test('sends PATCH /api/users/me with the provided body', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        id: 1, email: 'me@example.com', firstName: 'Khadija', lastName: 'K',
        name: 'Khadija K', role: 'innovator', sector: null, status: 'active',
        phone: '+255700000000', bio: null, location: null, avatarUrl: null,
        emailVerified: true,
        emailApplications: true, emailUpdates: true, emailReminders: true,
        pushApplications: false, pushUpdates: false, pushReminders: false,
      }),
    });

    const updated = await usersApi.updateMe({
      firstName: 'Khadija',
      phone: '+255700000000',
      emailApplications: true,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/users\/me$/);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({
      firstName: 'Khadija',
      phone: '+255700000000',
      emailApplications: true,
    });
    expect(updated.firstName).toBe('Khadija');
    expect(updated.emailApplications).toBe(true);
  });

  test('throws an ApiError when the backend returns 400', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'firstName must not be blank' }),
    });

    await expect(usersApi.updateMe({ firstName: '' }))
      .rejects.toMatchObject({
        name: 'ApiError',
        status: 400,
        message: 'firstName must not be blank',
      });
  });
});

