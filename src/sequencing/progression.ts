import type { Lesson } from '../content/schema';
import type { Band } from '../data/db';
import { getCompetency } from '../data/competencies';

// The progression engine: pure functions that turn "which skills has this
// learner mastered" into "what can they do next". No Dexie, no React — so it is
// fully unit-testable. The journey map and band placement are built from these.

export type LessonState = 'done' | 'available' | 'locked';

export interface LessonProgress {
  lesson: Lesson;
  state: LessonState;
  /** Prerequisite skill ids not yet mastered (only meaningful when locked). */
  missingPrereqs: string[];
}

/**
 * The skills a lesson depends on: the prerequisites of its own skills, minus any
 * skill the lesson itself teaches (a lesson never blocks on what it delivers).
 */
export function lessonPrerequisiteSkills(lesson: Lesson): string[] {
  const own = new Set(lesson.skills);
  const prereqs = new Set<string>();
  for (const skillId of lesson.skills) {
    for (const prereq of getCompetency(skillId).prerequisites) {
      if (!own.has(prereq)) prereqs.add(prereq);
    }
  }
  return [...prereqs];
}

/** A lesson is complete when every skill it teaches is mastered. */
export function isLessonComplete(lesson: Lesson, mastered: ReadonlySet<string>): boolean {
  return lesson.skills.every((skillId) => mastered.has(skillId));
}

/** A lesson is unlocked when all of its prerequisite skills are mastered. */
export function isLessonUnlocked(lesson: Lesson, mastered: ReadonlySet<string>): boolean {
  return lessonPrerequisiteSkills(lesson).every((skillId) => mastered.has(skillId));
}

export function lessonProgress(lesson: Lesson, mastered: ReadonlySet<string>): LessonProgress {
  const missingPrereqs = lessonPrerequisiteSkills(lesson).filter((s) => !mastered.has(s));
  const state: LessonState = isLessonComplete(lesson, mastered)
    ? 'done'
    : missingPrereqs.length > 0
      ? 'locked'
      : 'available';
  return { lesson, state, missingPrereqs };
}

/** Order lessons within a track: by explicit `order`, then id for stability. */
export function orderLessons(lessons: readonly Lesson[]): Lesson[] {
  return [...lessons].sort(
    (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id),
  );
}

/** The ordered journey (with per-lesson state) for a set of lessons. */
export function buildJourney(
  lessons: readonly Lesson[],
  mastered: ReadonlySet<string>,
): LessonProgress[] {
  return orderLessons(lessons).map((lesson) => lessonProgress(lesson, mastered));
}

/**
 * Adaptive placement (Teaching at the Right Level): a learner is ready to move
 * up once every lesson at their current band is complete and a higher band
 * exists. Initial placement is the seeded band; this nudges it upward.
 */
export function readyForNextBand(
  currentBand: Band,
  bandLessons: readonly Lesson[],
  mastered: ReadonlySet<string>,
): boolean {
  return (
    currentBand < 3 &&
    bandLessons.length > 0 &&
    bandLessons.every((lesson) => isLessonComplete(lesson, mastered))
  );
}
