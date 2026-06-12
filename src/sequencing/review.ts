// Spaced repetition (a Leitner-box scheduler) to keep mastered facts/vocabulary
// fresh. Pure + testable; the data layer/UI wire it in later. A skill the child
// gets right moves up a box (longer until next review); a miss drops it back to
// box 0 (review soon). This pairs with the mastery gate: skills are *mastered*
// at the gate, then resurfaced periodically so they stick.

const DAY = 86_400_000;

/** Days until the next review for each box (capped at the last entry). */
export const BOX_INTERVALS_DAYS = [1, 3, 7, 16, 35] as const;

export interface ReviewState {
  skillId: string;
  /** Leitner box: 0 = review soonest, higher = longer interval. */
  box: number;
  lastReviewedAt: number;
}

export function initReview(skillId: string, now: number): ReviewState {
  return { skillId, box: 0, lastReviewedAt: now };
}

function intervalMs(box: number): number {
  const index = Math.min(Math.max(box, 0), BOX_INTERVALS_DAYS.length - 1);
  return BOX_INTERVALS_DAYS[index]! * DAY;
}

/** Apply a review outcome: correct promotes a box, a miss resets to box 0. */
export function review(state: ReviewState, correct: boolean, now: number): ReviewState {
  const box = correct ? Math.min(state.box + 1, BOX_INTERVALS_DAYS.length - 1) : 0;
  return { ...state, box, lastReviewedAt: now };
}

/** When this skill is next due for review. */
export function dueAt(state: ReviewState): number {
  return state.lastReviewedAt + intervalMs(state.box);
}

export function isDue(state: ReviewState, now: number): boolean {
  return now >= dueAt(state);
}

/** The skill ids due for review now, soonest-overdue first. */
export function dueSkills(states: readonly ReviewState[], now: number): string[] {
  return states
    .filter((s) => isDue(s, now))
    .sort((a, b) => dueAt(a) - dueAt(b))
    .map((s) => s.skillId);
}
