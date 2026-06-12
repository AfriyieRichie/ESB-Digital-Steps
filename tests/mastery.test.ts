import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/data/db';
import {
  learnerSummary,
  skillStat,
  writeAttempts,
} from '../src/data/attempts';
import {
  MASTERY_ACCURACY,
  MASTERY_MIN_ATTEMPTS,
  evaluateMastery,
  isMastered,
  recordAttempt,
} from '../src/data/mastery';
import { getDemonstratedCompetencyIds } from '../src/data/events';

const LESSON = 'tap';

beforeEach(async () => {
  await db.attempts.clear();
  await db.competencyEvents.clear();
});

async function attempt(learnerId: string, skill: string, correct: boolean): Promise<void> {
  await writeAttempts(learnerId, [skill], { correct, ms: 500, lessonId: LESSON });
}

describe('attempt log + skill stats', () => {
  it('accumulates attempts and computes accuracy / time per skill', async () => {
    await attempt('learner-ama', 'u_tap', true);
    await attempt('learner-ama', 'u_tap', true);
    await attempt('learner-ama', 'u_tap', false);

    const stat = await skillStat('learner-ama', 'u_tap');
    expect(stat.attempts).toBe(3);
    expect(stat.correct).toBe(2);
    expect(stat.accuracy).toBeCloseTo(2 / 3);
    expect(stat.totalMs).toBe(1500);
  });

  it('writes one row per skill an action evidences', async () => {
    await writeAttempts('learner-ama', ['u_power', 'u_tap'], {
      correct: true,
      ms: 200,
      lessonId: LESSON,
    });
    expect(await db.attempts.count()).toBe(2);
    expect((await skillStat('learner-ama', 'u_power')).attempts).toBe(1);
    expect((await skillStat('learner-ama', 'u_tap')).attempts).toBe(1);
  });

  it('rolls up a learner summary across all attempts', async () => {
    await attempt('learner-ama', 'u_tap', true);
    await attempt('learner-ama', 'u_power', false);
    const summary = await learnerSummary('learner-ama');
    expect(summary.attempts).toBe(2);
    expect(summary.correct).toBe(1);
    expect(summary.accuracy).toBeCloseTo(0.5);
  });
});

describe('mastery derivation', () => {
  it('is not mastered below the minimum number of attempts', () => {
    expect(
      isMastered({ skillId: 'u_tap', attempts: MASTERY_MIN_ATTEMPTS - 1, correct: 99, accuracy: 1, totalMs: 0, lastAt: 0 }),
    ).toBe(false);
  });

  it('is not mastered below the accuracy threshold', () => {
    expect(
      isMastered({
        skillId: 'u_tap',
        attempts: MASTERY_MIN_ATTEMPTS + 2,
        correct: 1,
        accuracy: MASTERY_ACCURACY - 0.1,
        totalMs: 0,
        lastAt: 0,
      }),
    ).toBe(false);
  });

  it('is mastered once enough accurate evidence exists', () => {
    expect(
      isMastered({ skillId: 'u_tap', attempts: MASTERY_MIN_ATTEMPTS, correct: MASTERY_MIN_ATTEMPTS, accuracy: 1, totalMs: 0, lastAt: 0 }),
    ).toBe(true);
  });

  it('records a CompetencyEvent the moment a skill crosses the threshold, once', async () => {
    // Up to the threshold there is no event yet.
    for (let i = 0; i < MASTERY_MIN_ATTEMPTS - 1; i += 1) {
      const newly = await recordAttempt('learner-ama', ['u_tap'], { correct: true, ms: 300, lessonId: LESSON });
      expect(newly).toEqual([]);
    }
    expect(await getDemonstratedCompetencyIds('learner-ama')).toEqual(new Set());

    // The attempt that reaches MASTERY_MIN_ATTEMPTS at full accuracy masters it.
    const crossed = await recordAttempt('learner-ama', ['u_tap'], { correct: true, ms: 300, lessonId: LESSON });
    expect(crossed).toEqual(['u_tap']);
    expect(await getDemonstratedCompetencyIds('learner-ama')).toEqual(new Set(['u_tap']));

    // Further correct attempts do not re-record it (idempotent milestone).
    const again = await recordAttempt('learner-ama', ['u_tap'], { correct: true, ms: 300, lessonId: LESSON });
    expect(again).toEqual([]);
    expect(await db.competencyEvents.where('learnerId').equals('learner-ama').count()).toBe(1);
  });

  it('does not master a skill the learner keeps getting wrong', async () => {
    for (let i = 0; i < MASTERY_MIN_ATTEMPTS * 2; i += 1) {
      await recordAttempt('learner-ama', ['u_tap'], { correct: i % 2 === 0, ms: 100, lessonId: LESSON });
    }
    // 50% accuracy is below the threshold, so no mastery event.
    expect(await getDemonstratedCompetencyIds('learner-ama')).toEqual(new Set());
  });

  it('completing a 6-tap lesson masters its skills (end-to-end of the slice)', async () => {
    // Mirrors the Tap lesson: 6 correct taps, each evidencing both skills.
    for (let i = 0; i < 6; i += 1) {
      await recordAttempt('learner-ama', ['u_power', 'u_tap'], { correct: true, ms: 250, lessonId: LESSON });
    }
    const mastered = await getDemonstratedCompetencyIds('learner-ama');
    expect(mastered).toEqual(new Set(['u_power', 'u_tap']));
  });

  it('evaluateMastery is a pure re-check that can be called without new attempts', async () => {
    for (let i = 0; i < MASTERY_MIN_ATTEMPTS; i += 1) {
      await writeAttempts('learner-esi', ['u_tap'], { correct: true, ms: 100, lessonId: LESSON });
    }
    // No event yet because we only wrote attempts, never evaluated.
    expect(await getDemonstratedCompetencyIds('learner-esi')).toEqual(new Set());
    const newly = await evaluateMastery('learner-esi', ['u_tap'], LESSON);
    expect(newly).toEqual(['u_tap']);
  });
});
