import { parseLesson, type Lesson } from './schema';
import type { Band } from '../data/db';
import type { SubjectId } from '../data/subjects';

// All bundled lesson JSON is imported here and validated through Zod at module
// load. If any lesson is malformed the app fails fast with a clear error rather
// than rendering a blank screen.
//
// Lessons live under content/<subject>/. Vite's import.meta.glob bundles them
// at build time (eager, local — no runtime fetch), keeping us fully offline.

const rawLessons = import.meta.glob('./*/*.json', { eager: true, import: 'default' });

export const LESSONS: readonly Lesson[] = Object.values(rawLessons).map((raw) =>
  parseLesson(raw),
);

const LESSON_BY_ID: ReadonlyMap<string, Lesson> = new Map(LESSONS.map((l) => [l.id, l]));

export function getLesson(id: string): Lesson {
  const lesson = LESSON_BY_ID.get(id);
  if (!lesson) throw new Error(`Unknown lesson: ${id}`);
  return lesson;
}

/** Lessons available to a learner at a given band, optionally for one subject. */
export function lessonsForBand(band: Band, subject?: SubjectId): readonly Lesson[] {
  return LESSONS.filter((l) => l.band === band && (subject === undefined || l.subject === subject));
}
