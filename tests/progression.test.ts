import { describe, expect, it } from 'vitest';
import { lessonsForBand, getLesson } from '../src/content/lessons';
import {
  buildJourney,
  isLessonComplete,
  isLessonUnlocked,
  lessonPrerequisiteSkills,
  readyForNextBand,
} from '../src/sequencing/progression';

const countLesson = getLesson('count'); // teaches m_count (no prereqs)
const numeralsLesson = getLesson('numerals'); // teaches m_numeral (prereq m_count)

describe('lesson prerequisites & gating', () => {
  it('derives prerequisite skills from the lesson’s skills', () => {
    expect(lessonPrerequisiteSkills(countLesson)).toEqual([]);
    expect(lessonPrerequisiteSkills(numeralsLesson)).toEqual(['m_count']);
  });

  it('locks a lesson until its prerequisites are mastered', () => {
    const none = new Set<string>();
    expect(isLessonUnlocked(countLesson, none)).toBe(true);
    expect(isLessonUnlocked(numeralsLesson, none)).toBe(false);

    const countMastered = new Set(['m_count']);
    expect(isLessonUnlocked(numeralsLesson, countMastered)).toBe(true);
  });

  it('marks a lesson complete only when all its skills are mastered', () => {
    expect(isLessonComplete(numeralsLesson, new Set(['m_count']))).toBe(false);
    expect(isLessonComplete(numeralsLesson, new Set(['m_count', 'm_numeral']))).toBe(true);
  });
});

describe('buildJourney', () => {
  it('orders lessons and assigns done / available / locked states', () => {
    const band1 = lessonsForBand(1);

    // Fresh learner: numerals is locked behind count.
    const fresh = buildJourney(band1, new Set());
    const numeralsFresh = fresh.find((p) => p.lesson.id === 'numerals');
    const countFresh = fresh.find((p) => p.lesson.id === 'count');
    expect(countFresh?.state).toBe('available');
    expect(numeralsFresh?.state).toBe('locked');
    expect(numeralsFresh?.missingPrereqs).toEqual(['m_count']);

    // After mastering count, numerals unlocks and count shows done.
    const afterCount = buildJourney(band1, new Set(['m_count']));
    expect(afterCount.find((p) => p.lesson.id === 'count')?.state).toBe('done');
    expect(afterCount.find((p) => p.lesson.id === 'numerals')?.state).toBe('available');
  });

  it('respects the order field within a subject track', () => {
    const journey = buildJourney(lessonsForBand(1), new Set());
    const numeracy = journey.filter((p) => p.lesson.subject === 'numeracy').map((p) => p.lesson.id);
    expect(numeracy).toEqual(['count', 'numerals', 'compare', 'shapes']);
  });
});

describe('cross-band prerequisites (Teaching at the Right Level)', () => {
  it('does not lock a band-3 lesson behind a prerequisite taught only at a lower band', () => {
    // words (r_word) depends on r_letter, and addmatch (m_add) depends on
    // m_count — both taught at band 1, not band 3. A band-3 learner with no
    // mastery should still find them available, not locked.
    const journey = buildJourney(lessonsForBand(3), new Set());
    for (const progress of journey) {
      expect(progress.state, progress.lesson.id).toBe('available');
    }
  });

  it('still gates within a band (numerals stays locked behind count)', () => {
    const journey = buildJourney(lessonsForBand(1), new Set());
    expect(journey.find((p) => p.lesson.id === 'numerals')?.state).toBe('locked');
  });
});

describe('band placement (Teaching at the Right Level)', () => {
  it('is not ready to advance until every band lesson is complete', () => {
    const band1 = lessonsForBand(1);
    expect(readyForNextBand(1, band1, new Set())).toBe(false);
  });

  it('is ready to advance once all current-band skills are mastered', () => {
    const band1 = lessonsForBand(1);
    const allSkills = new Set(band1.flatMap((l) => l.skills));
    expect(readyForNextBand(1, band1, allSkills)).toBe(true);
  });

  it('never advances past the top band', () => {
    const band1 = lessonsForBand(1);
    const allSkills = new Set(band1.flatMap((l) => l.skills));
    expect(readyForNextBand(5, band1, allSkills)).toBe(false);
  });
});
