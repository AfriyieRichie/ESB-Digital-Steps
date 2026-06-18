import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/content/lessons';
import { ACTIVITY_REGISTRY } from '../src/activities/registry';
import { competenciesForSubject, isCompetencyId } from '../src/data/competencies';
import { strandBelongsToSubject } from '../src/data/strands';
import { SUBJECT_IDS } from '../src/data/subjects';

// Guards the authored content as a whole: everything under content/ loads and
// validates (LESSONS would throw on import otherwise), and every lesson is
// internally consistent and playable by a registered activity.

describe('bundled lessons', () => {
  it('loads at least the authored lessons', () => {
    const ids = LESSONS.map((l) => l.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'tap',
        'parts',
        'count',
        'numerals',
        'letters',
        'drag',
        'care',
        'words',
        'addmatch',
        'buildword',
        'bigwords',
        // Reading curriculum across the five bands
        'sounds',
        'rhyme',
        'wordfamily',
        'cloze',
        'mainidea',
        'synonyms',
        'context',
        'inference',
        'figurative',
        'purpose',
        'evaluate',
        // Writing curriculum across the five bands
        'buildword',
        'bigwords',
        'sentence',
        'punctuation',
        'paragraph',
        'essay',
        'argument',
        // Numeracy curriculum across the five bands
        'count',
        'numerals',
        'compare',
        'shapes',
        'addmatch',
        'subtract',
        'placevalue',
        'multiply',
        'fractions',
        'data',
        'percent',
        'prealgebra',
        'negatives',
        'linear',
        'coordinates',
        'statistics',
        // Science curriculum across the five bands
        'senses',
        'living',
        'animals',
        'materials',
        'states',
        'lifecycle',
        'method',
        'hypothesis',
        'forces',
        'body',
        'cells',
        'atoms',
        'energy',
        // Digital curriculum across the five bands
        'tap',
        'parts',
        'drag',
        'care',
        'icons',
        'typing',
        'safelink',
        'sequence',
        'search',
        'etiquette',
        'loops',
        'passwords',
        'misinfo',
        'conditions',
        'algorithms',
        'footprint',
        // Logic & problem solving across the five bands
        'patterns',
        'sorting',
        'sequences',
        'oddone',
        'analogies',
        'deduce',
        'multistep',
        'conditional',
        'validity',
        'fallacies',
        // Social studies across the five bands
        'helpers',
        'maps',
        'community',
        'geography',
        'history',
        'civics',
        'economy',
        'causes',
        'global',
        // Social-emotional learning across the five bands
        'feelings',
        'calm',
        'kindness',
        'empathy',
        'teamwork',
        'goals',
        // Creative arts across the five bands
        'colour',
        'sound',
        'shape',
        'rhythm',
        'mix',
        'tempo',
        'compose',
        'instruments',
        'style',
        'form',
      ]),
    );
  });

  it('every step uses a registered activity type', () => {
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) {
        expect(ACTIVITY_REGISTRY[step.activityType]).toBeDefined();
      }
    }
  });

  it('every one of the nine subjects has lessons', () => {
    const subjectsWithLessons = new Set(LESSONS.map((l) => l.subject));
    for (const subject of SUBJECT_IDS) {
      expect(competenciesForSubject(subject).length, `competencies for ${subject}`).toBeGreaterThan(0);
      expect(subjectsWithLessons.has(subject), `lessons for ${subject}`).toBe(true);
    }
  });

  it('spans all five developmental bands', () => {
    const bands = new Set(LESSONS.map((l) => l.band));
    expect([...bands].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('every lesson is internally consistent (strand, skills)', () => {
    for (const lesson of LESSONS) {
      expect(strandBelongsToSubject(lesson.strand, lesson.subject)).toBe(true);
      for (const skill of lesson.skills) {
        expect(isCompetencyId(skill)).toBe(true);
      }
    }
  });
});
