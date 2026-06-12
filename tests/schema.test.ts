import { describe, expect, it } from 'vitest';
import {
  chooseItemSchema,
  parseLesson,
  typeItemSchema,
  type Lesson,
} from '../src/content/schema';

// A valid v2 lesson: subject + strand (consistent), skills from the framework,
// and an ordered list of steps each carrying a registered activity + config.
const validLesson = {
  id: 'tap',
  subject: 'digital',
  strand: 'd_use',
  band: 1,
  title: 'Wake it and tap',
  blurb: 'Tap the stars.',
  skills: ['u_power', 'u_tap'],
  steps: [{ activityType: 'tap', config: { count: 6 } }],
};

describe('parseLesson (content model v2)', () => {
  it('accepts a well-formed lesson', () => {
    const lesson: Lesson = parseLesson(validLesson);
    expect(lesson.id).toBe('tap');
    expect(lesson.strand).toBe('d_use');
    expect(lesson.steps).toHaveLength(1);
    expect(lesson.steps[0]).toEqual({ activityType: 'tap', config: { count: 6 } });
  });

  it('accepts a multi-step lesson', () => {
    const lesson = parseLesson({
      ...validLesson,
      steps: [
        { activityType: 'tap', config: { count: 3 } },
        { activityType: 'tap', config: { count: 5 } },
      ],
    });
    expect(lesson.steps).toHaveLength(2);
  });

  it('rejects a lesson whose strand does not belong to its subject', () => {
    // d_use is a digital strand, not a reading one.
    expect(() => parseLesson({ ...validLesson, subject: 'reading' })).toThrow(
      /strand does not belong/i,
    );
  });

  it('rejects an unknown strand', () => {
    expect(() => parseLesson({ ...validLesson, strand: 'made_up' })).toThrow(/Invalid lesson/);
  });

  it('rejects a skill id that is not in the framework', () => {
    expect(() => parseLesson({ ...validLesson, skills: ['not_a_skill'] })).toThrow(
      /not in the competency framework/i,
    );
  });

  it('requires at least one step', () => {
    expect(() => parseLesson({ ...validLesson, steps: [] })).toThrow(/Invalid lesson/);
  });

  it('rejects an unknown activity type in a step', () => {
    expect(() =>
      parseLesson({ ...validLesson, steps: [{ activityType: 'fly', config: {} }] }),
    ).toThrow(/Invalid lesson/);
  });

  it('rejects extra/unknown keys (strict)', () => {
    expect(() => parseLesson({ ...validLesson, surprise: true })).toThrow(/Invalid lesson/);
  });

  it('names the lesson id in the error message', () => {
    expect(() => parseLesson({ ...validLesson, id: 'broken', band: 9 })).toThrow(/"broken"/);
  });
});

describe('item schemas (ready for slice #3 activities)', () => {
  it('validates a choose item and rejects an out-of-range answer', () => {
    const ok = chooseItemSchema.safeParse({
      id: 'q1',
      prompt: 'Which one is the power button?',
      choices: ['A', 'B', 'C'],
      answerIndex: 2,
    });
    expect(ok.success).toBe(true);

    const bad = chooseItemSchema.safeParse({
      id: 'q1',
      prompt: 'Pick one',
      choices: ['A', 'B'],
      answerIndex: 5,
    });
    expect(bad.success).toBe(false);
  });

  it('validates a type item', () => {
    const ok = typeItemSchema.safeParse({ id: 't1', prompt: 'Type your name', answer: 'Ama' });
    expect(ok.success).toBe(true);
  });
});
