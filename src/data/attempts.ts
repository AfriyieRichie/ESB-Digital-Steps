import { db, type Attempt } from './db';

// The attempt log: raw evidence of what a learner did. This module only reads
// and writes attempts and computes statistics from them — it knows nothing about
// mastery thresholds (that lives in mastery.ts), keeping the data layer simple.

export interface AttemptInput {
  correct: boolean;
  ms: number;
  lessonId: string;
  itemId?: string;
}

/**
 * Write one attempt row per skill the action evidences. A single tap or answer
 * can demonstrate several of a lesson's skills, so it fans out into one row per
 * skill — that is the unit mastery is computed over.
 */
export async function writeAttempts(
  learnerId: string,
  skillIds: readonly string[],
  input: AttemptInput,
  at: number = Date.now(),
): Promise<void> {
  if (skillIds.length === 0) return;
  const rows: Attempt[] = skillIds.map((skillId) => ({
    learnerId,
    skillId,
    lessonId: input.lessonId,
    ...(input.itemId !== undefined ? { itemId: input.itemId } : {}),
    correct: input.correct,
    ms: input.ms,
    at,
  }));
  await db.attempts.bulkAdd(rows);
}

export interface SkillStat {
  skillId: string;
  attempts: number;
  correct: number;
  /** 0..1; 0 when there are no attempts yet. */
  accuracy: number;
  totalMs: number;
  lastAt: number | null;
}

function statFrom(skillId: string, rows: readonly Attempt[]): SkillStat {
  const attempts = rows.length;
  const correct = rows.reduce((n, r) => (r.correct ? n + 1 : n), 0);
  const totalMs = rows.reduce((n, r) => n + r.ms, 0);
  const lastAt = rows.reduce<number | null>((max, r) => (max === null || r.at > max ? r.at : max), null);
  return {
    skillId,
    attempts,
    correct,
    accuracy: attempts === 0 ? 0 : correct / attempts,
    totalMs,
    lastAt,
  };
}

/** Per-skill statistics for one learner+skill pair. */
export async function skillStat(learnerId: string, skillId: string): Promise<SkillStat> {
  const rows = await db.attempts.where('[learnerId+skillId]').equals([learnerId, skillId]).toArray();
  return statFrom(skillId, rows);
}

/** Per-skill statistics for every skill a learner has attempted. */
export async function skillStatsForLearner(learnerId: string): Promise<Map<string, SkillStat>> {
  const rows = await db.attempts.where('learnerId').equals(learnerId).toArray();
  const bySkill = new Map<string, Attempt[]>();
  for (const row of rows) {
    const list = bySkill.get(row.skillId);
    if (list) list.push(row);
    else bySkill.set(row.skillId, [row]);
  }
  const stats = new Map<string, SkillStat>();
  for (const [skillId, skillRows] of bySkill) {
    stats.set(skillId, statFrom(skillId, skillRows));
  }
  return stats;
}

export interface LearnerSummary {
  attempts: number;
  correct: number;
  /** 0..1 overall accuracy; 0 when there are no attempts. */
  accuracy: number;
  totalMs: number;
  lastAt: number | null;
}

/** Roll-up across all of a learner's attempts (for the facilitator dashboard). */
export async function learnerSummary(learnerId: string): Promise<LearnerSummary> {
  const rows = await db.attempts.where('learnerId').equals(learnerId).toArray();
  const stat = statFrom('*', rows);
  return {
    attempts: stat.attempts,
    correct: stat.correct,
    accuracy: stat.accuracy,
    totalMs: stat.totalMs,
    lastAt: stat.lastAt,
  };
}
