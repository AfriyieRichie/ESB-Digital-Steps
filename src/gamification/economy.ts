// Pure gamification maths — stars, XP, and streaks — with no Dexie or React, so
// it is fully unit-testable. The Dexie service (progress.ts) and badge rules
// (badges.ts) build on these.

export interface ProgressSnapshot {
  xp: number;
  stars: number;
  totalStarsEarned: number;
  lessonsCompleted: number;
  skillsMastered: number;
  streakDays: number;
  lastActiveDay: number | null;
}

export const EMPTY_PROGRESS: ProgressSnapshot = {
  xp: 0,
  stars: 0,
  totalStarsEarned: 0,
  lessonsCompleted: 0,
  skillsMastered: 0,
  streakDays: 0,
  lastActiveDay: null,
};

// Reward rates. Mastering a skill is worth more than simply finishing.
export const STARS_PER_LESSON = 1;
export const STARS_PER_MASTERY = 3;
export const XP_PER_LESSON = 10;
export const XP_PER_MASTERY = 5;

/** Local-day index (days since the Unix epoch in the device's timezone). */
export function dayNumber(at: number): number {
  const d = new Date(at);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

/**
 * The streak after activity on `today`: unchanged on the same day, +1 on the
 * next consecutive day, otherwise reset to 1 (a new streak begins).
 */
export function nextStreak(
  prev: { streakDays: number; lastActiveDay: number | null },
  today: number,
): number {
  if (prev.lastActiveDay === null) return 1;
  if (today === prev.lastActiveDay) return prev.streakDays;
  if (today === prev.lastActiveDay + 1) return prev.streakDays + 1;
  return 1;
}

export interface CompletionReward {
  next: ProgressSnapshot;
  starsEarned: number;
  xpEarned: number;
}

/**
 * Apply one completed activity to a progress snapshot: award stars + XP, update
 * the streak, and bump the lifetime counters. Pure — returns the next snapshot.
 */
export function applyCompletion(
  prev: ProgressSnapshot,
  opts: { newlyMastered: number; today: number },
): CompletionReward {
  const newlyMastered = Math.max(0, opts.newlyMastered);
  const starsEarned = STARS_PER_LESSON + STARS_PER_MASTERY * newlyMastered;
  const xpEarned = XP_PER_LESSON + XP_PER_MASTERY * newlyMastered;
  const streakDays = nextStreak(prev, opts.today);

  return {
    starsEarned,
    xpEarned,
    next: {
      xp: prev.xp + xpEarned,
      stars: prev.stars + starsEarned,
      totalStarsEarned: prev.totalStarsEarned + starsEarned,
      lessonsCompleted: prev.lessonsCompleted + 1,
      skillsMastered: prev.skillsMastered + newlyMastered,
      streakDays,
      lastActiveDay: opts.today,
    },
  };
}

export function canAfford(stars: number, cost: number): boolean {
  return stars >= cost;
}
