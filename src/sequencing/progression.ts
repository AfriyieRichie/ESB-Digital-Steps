import type { Lesson } from '../content/schema';
import { MAX_BAND, type Band } from '../data/db';
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

/**
 * Per-lesson state, gating only on prerequisites that are taught within the
 * learner's own band (`bandSkills`). A prerequisite met only at a lower band is
 * assumed satisfied — a learner placed at a higher band already has the
 * foundations and must not be locked out (Teaching at the Right Level). Pass the
 * full prerequisite set as `bandSkills` to gate on everything.
 */
export function lessonProgress(
  lesson: Lesson,
  mastered: ReadonlySet<string>,
  bandSkills: ReadonlySet<string>,
): LessonProgress {
  const gatingPrereqs = lessonPrerequisiteSkills(lesson).filter((s) => bandSkills.has(s));
  const missingPrereqs = gatingPrereqs.filter((s) => !mastered.has(s));
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

/**
 * The ordered journey (with per-lesson state) for one band's lessons. Gating is
 * band-aware: a lesson is only locked behind prerequisites that are themselves
 * taught at this band, so cross-band prerequisites don't strand a learner placed
 * higher up.
 */
export function buildJourney(
  lessons: readonly Lesson[],
  mastered: ReadonlySet<string>,
): LessonProgress[] {
  const bandSkills = new Set(lessons.flatMap((l) => l.skills));
  return orderLessons(lessons).map((lesson) => lessonProgress(lesson, mastered, bandSkills));
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
    currentBand < MAX_BAND &&
    bandLessons.length > 0 &&
    bandLessons.every((lesson) => isLessonComplete(lesson, mastered))
  );
}
