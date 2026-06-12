import { describe, expect, it } from 'vitest';
import {
  applyCompletion,
  dayNumber,
  EMPTY_PROGRESS,
  nextStreak,
  STARS_PER_LESSON,
  STARS_PER_MASTERY,
  XP_PER_LESSON,
  XP_PER_MASTERY,
} from '../src/gamification/economy';

const noon = (y: number, m: number, d: number): number => new Date(y, m, d, 12, 0, 0).getTime();

describe('streaks', () => {
  it('starts at 1 the first time', () => {
    expect(nextStreak({ streakDays: 0, lastActiveDay: null }, 100)).toBe(1);
  });

  it('does not change on the same day', () => {
    expect(nextStreak({ streakDays: 4, lastActiveDay: 100 }, 100)).toBe(4);
  });

  it('increments on the next consecutive day', () => {
    expect(nextStreak({ streakDays: 4, lastActiveDay: 100 }, 101)).toBe(5);
  });

  it('resets after a gap', () => {
    expect(nextStreak({ streakDays: 4, lastActiveDay: 100 }, 103)).toBe(1);
  });

  it('dayNumber is stable within a day and +1 the next day', () => {
    expect(dayNumber(noon(2026, 2, 1))).toBe(dayNumber(new Date(2026, 2, 1, 8, 30).getTime()));
    expect(dayNumber(noon(2026, 2, 2))).toBe(dayNumber(noon(2026, 2, 1)) + 1);
  });
});

describe('applyCompletion', () => {
  it('awards base stars/XP for finishing with no new mastery', () => {
    const r = applyCompletion(EMPTY_PROGRESS, { newlyMastered: 0, today: 10 });
    expect(r.starsEarned).toBe(STARS_PER_LESSON);
    expect(r.xpEarned).toBe(XP_PER_LESSON);
    expect(r.next.lessonsCompleted).toBe(1);
    expect(r.next.skillsMastered).toBe(0);
    expect(r.next.streakDays).toBe(1);
  });

  it('adds mastery bonuses and accumulates lifetime totals', () => {
    const first = applyCompletion(EMPTY_PROGRESS, { newlyMastered: 2, today: 10 });
    expect(first.starsEarned).toBe(STARS_PER_LESSON + STARS_PER_MASTERY * 2);
    expect(first.xpEarned).toBe(XP_PER_LESSON + XP_PER_MASTERY * 2);

    const second = applyCompletion(first.next, { newlyMastered: 1, today: 11 });
    expect(second.next.skillsMastered).toBe(3);
    expect(second.next.totalStarsEarned).toBe(first.starsEarned + second.starsEarned);
    expect(second.next.stars).toBe(first.starsEarned + second.starsEarned);
    expect(second.next.streakDays).toBe(2);
  });
});
