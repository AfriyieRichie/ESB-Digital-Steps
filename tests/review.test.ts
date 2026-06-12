import { describe, expect, it } from 'vitest';
import {
  BOX_INTERVALS_DAYS,
  dueSkills,
  initReview,
  isDue,
  review,
} from '../src/sequencing/review';

const DAY = 86_400_000;
const T0 = Date.parse('2026-06-01T08:00:00Z');

describe('spaced repetition (Leitner)', () => {
  it('a correct review promotes a box and lengthens the interval', () => {
    const start = initReview('u_tap', T0);
    expect(start.box).toBe(0);

    const after = review(start, true, T0);
    expect(after.box).toBe(1);
    // Not due until the box-1 interval has passed.
    expect(isDue(after, T0 + BOX_INTERVALS_DAYS[0]! * DAY)).toBe(false);
    expect(isDue(after, T0 + BOX_INTERVALS_DAYS[1]! * DAY)).toBe(true);
  });

  it('a miss drops back to box 0 (review soon)', () => {
    let state = initReview('u_tap', T0);
    state = review(state, true, T0); // box 1
    state = review(state, true, T0); // box 2
    state = review(state, false, T0); // miss -> box 0
    expect(state.box).toBe(0);
    expect(isDue(state, T0 + BOX_INTERVALS_DAYS[0]! * DAY)).toBe(true);
  });

  it('lists due skills soonest-overdue first', () => {
    const a = review(initReview('a', T0), true, T0); // box 1 -> due in 3 days
    const b = initReview('b', T0); // box 0 -> due in 1 day
    const now = T0 + 10 * DAY; // both overdue
    expect(dueSkills([a, b], now)).toEqual(['b', 'a']);
  });

  it('caps the box at the longest interval', () => {
    let state = initReview('x', T0);
    for (let i = 0; i < 20; i += 1) state = review(state, true, T0);
    expect(state.box).toBe(BOX_INTERVALS_DAYS.length - 1);
  });
});
