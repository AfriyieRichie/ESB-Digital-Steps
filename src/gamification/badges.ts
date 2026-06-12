import type { ProgressSnapshot } from './economy';

// Badge catalogue (content, not stored data). Each badge has a threshold rule
// evaluated against a learner's progress snapshot. Awarding is idempotent — a
// badge is granted the first time its rule is satisfied and never again.

export interface Badge {
  id: string;
  label: string;
  emoji: string;
  description: string;
  /** True when the learner's progress qualifies for this badge. */
  rule: (p: ProgressSnapshot) => boolean;
}

export const BADGES: readonly Badge[] = [
  {
    id: 'first_steps',
    label: 'First Steps',
    emoji: '👣',
    description: 'Finish your first activity.',
    rule: (p) => p.lessonsCompleted >= 1,
  },
  {
    id: 'sharp_mind',
    label: 'Sharp Mind',
    emoji: '🧠',
    description: 'Master your first skill.',
    rule: (p) => p.skillsMastered >= 1,
  },
  {
    id: 'on_a_roll',
    label: 'On a Roll',
    emoji: '🔥',
    description: 'Play on 3 different days in a row.',
    rule: (p) => p.streakDays >= 3,
  },
  {
    id: 'star_gatherer',
    label: 'Star Gatherer',
    emoji: '⭐',
    description: 'Earn 25 stars in total.',
    rule: (p) => p.totalStarsEarned >= 25,
  },
  {
    id: 'rising_star',
    label: 'Rising Star',
    emoji: '🌟',
    description: 'Master 5 skills.',
    rule: (p) => p.skillsMastered >= 5,
  },
];

const BADGE_BY_ID: ReadonlyMap<string, Badge> = new Map(BADGES.map((b) => [b.id, b]));

export function getBadge(id: string): Badge {
  const badge = BADGE_BY_ID.get(id);
  if (!badge) throw new Error(`Unknown badge: ${id}`);
  return badge;
}

/** Every badge whose rule the given progress satisfies (earned or not yet). */
export function qualifyingBadges(p: ProgressSnapshot): Badge[] {
  return BADGES.filter((b) => b.rule(p));
}
