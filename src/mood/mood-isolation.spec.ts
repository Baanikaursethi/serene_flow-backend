/**
 * mood-isolation.spec.ts
 *
 * Tests for MoodService user data isolation:
 * - A user only sees their own mood history
 * - Creating a mood stores the correct userEmail
 * - getLatestMood returns null when no moods exist
 * - getMoodHistory returns newest-first ordering
 */

jest.mock('../firebase', () => ({ FirebaseService: class {} }));

import { MoodService } from './mood.service';

function makeService(moods: Map<string, any>) {
  return new MoodService({
    firestore: null,
    getCollection: jest.fn(() => moods),
  } as any);
}

describe('MoodService — user data isolation', () => {
  it('getMoodHistory returns only the authenticated user\'s moods', async () => {
    const moods = new Map<string, any>([
      ['mood-a1', { id: 'mood-a1', userEmail: 'usera@test.com', moodLabel: 'Happy', rating: 5, timestamp: '2026-01-02T10:00:00.000Z' }],
      ['mood-b1', { id: 'mood-b1', userEmail: 'userb@test.com', moodLabel: 'Sad', rating: 2, timestamp: '2026-01-01T10:00:00.000Z' }],
      ['mood-a2', { id: 'mood-a2', userEmail: 'usera@test.com', moodLabel: 'Calm', rating: 4, timestamp: '2026-01-03T10:00:00.000Z' }],
    ]);
    const svc = makeService(moods);

    const userAHistory = await svc.getMoodHistory({ email: 'usera@test.com', uid: 'uid-a' });
    const userBHistory = await svc.getMoodHistory({ email: 'userb@test.com', uid: 'uid-b' });

    // User A only sees their 2 moods, User B only sees their 1 mood
    expect(userAHistory).toHaveLength(2);
    expect(userAHistory.every((m: any) => m.userEmail === 'usera@test.com')).toBe(true);

    expect(userBHistory).toHaveLength(1);
    expect(userBHistory[0].userEmail).toBe('userb@test.com');
  });

  it('getMoodHistory returns entries sorted newest-first', async () => {
    const moods = new Map<string, any>([
      ['mood-1', { id: 'mood-1', userEmail: 'user@test.com', moodLabel: 'Sad', rating: 2, timestamp: '2026-01-01T10:00:00.000Z' }],
      ['mood-2', { id: 'mood-2', userEmail: 'user@test.com', moodLabel: 'Happy', rating: 5, timestamp: '2026-01-03T10:00:00.000Z' }],
      ['mood-3', { id: 'mood-3', userEmail: 'user@test.com', moodLabel: 'Calm', rating: 4, timestamp: '2026-01-02T10:00:00.000Z' }],
    ]);
    const svc = makeService(moods);

    const history = await svc.getMoodHistory({ email: 'user@test.com', uid: 'uid-1' });

    expect(history[0].moodLabel).toBe('Happy');    // 2026-01-03 — newest
    expect(history[1].moodLabel).toBe('Calm');     // 2026-01-02
    expect(history[2].moodLabel).toBe('Sad');      // 2026-01-01 — oldest
  });

  it('getLatestMood returns null when no moods exist for user', async () => {
    const moods = new Map<string, any>();
    const svc = makeService(moods);

    const latest = await svc.getLatestMood({ email: 'empty@test.com', uid: 'uid-empty' });

    expect(latest).toBeNull();
  });

  it('getLatestMood returns the most recent mood entry', async () => {
    const moods = new Map<string, any>([
      ['mood-old', { id: 'mood-old', userEmail: 'user@test.com', moodLabel: 'Sad', rating: 2, timestamp: '2026-01-01T10:00:00.000Z' }],
      ['mood-new', { id: 'mood-new', userEmail: 'user@test.com', moodLabel: 'Happy', rating: 5, timestamp: '2026-01-05T10:00:00.000Z' }],
    ]);
    const svc = makeService(moods);

    const latest = await svc.getLatestMood({ email: 'user@test.com', uid: 'uid-1' });

    expect(latest!.moodLabel).toBe('Happy');
  });

  it('createMood stores the correct userEmail from the authenticated payload', async () => {
    const moods = new Map<string, any>();
    const svc = makeService(moods);

    await svc.createMood(
      { email: 'user@test.com', uid: 'uid-1' },
      { rating: 4, moodLabel: 'Calm' } as any,
    );

    expect(moods.size).toBe(1);
    const stored = Array.from(moods.values())[0];
    expect(stored.userEmail).toBe('user@test.com');
    expect(stored.moodLabel).toBe('Calm');
    expect(stored.timestamp).toBeTruthy();
  });

  it('user email is always lowercased for storage (prevents duplicate entries)', async () => {
    const moods = new Map<string, any>();
    const svc = makeService(moods);

    await svc.createMood(
      { email: 'User@Test.COM', uid: 'uid-1' },
      { rating: 3, moodLabel: 'Tired' } as any,
    );

    const stored = Array.from(moods.values())[0];
    expect(stored.userEmail).toBe('user@test.com');
  });
});
;