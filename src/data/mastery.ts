import { recordCompetency } from './events';
import { skillStat, writeAttempts, type AttemptInput, type SkillStat } from './attempts';

// Mastery is *derived* from the attempt log, not asserted by completing a
// lesson. A skill counts as mastered once the learner has enough recent correct
// evidence for it. Crossing that line writes the idempotent CompetencyEvent —
// our funder-facing milestone — exactly once (see docs/CONTENT-ARCHITECTURE.md).

/** Minimum attempts before a skill can be judged mastered. */
export const MASTERY_MIN_ATTEMPTS = 4;
/** Accuracy (0..1) required across those attempts. */
export const MASTERY_ACCURACY = 0.8;

export function isMastered(stat: SkillStat): boolean {
  return stat.attempts >= MASTERY_MIN_ATTEMPTS && stat.accuracy >= MASTERY_ACCURACY;
}

/**
 * Re-evaluate the given skills for a learner against the attempt log and record
 * a CompetencyEvent for any that are newly mastered. Idempotent: skills already
 * recorded are skipped by recordCompetency. Returns the ids newly recorded.
 */
export async function evaluateMastery(
  learnerId: string,
  skillIds: readonly string[],
  lessonId: string,
): Promise<string[]> {
  const newlyMastered: string[] = [];
  for (const skillId of skillIds) {
    const stat = await skillStat(learnerId, skillId);
    if (!isMastered(stat)) continue;
    const created = await recordCompetency(learnerId, skillId, lessonId);
    if (created) newlyMastered.push(skillId);
  }
  return newlyMastered;
}

/**
 * Record an attempt for every skill it evidences, then re-evaluate mastery for
 * those skills. This is the single entry point activities use. Returns the
 * skills newly mastered by this attempt.
 */
export async function recordAttempt(
  learnerId: string,
  skillIds: readonly string[],
  input: AttemptInput,
  at: number = Date.now(),
): Promise<string[]> {
  await writeAttempts(learnerId, skillIds, input, at);
  return evaluateMastery(learnerId, skillIds, input.lessonId);
}
