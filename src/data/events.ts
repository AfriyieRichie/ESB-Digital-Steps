import { db, type CompetencyEvent } from './db';
import { COMPETENCIES, isCompetencyId } from './competencies';

// Recording and querying competency demonstrations. This is the funder-facing
// record of what each child has mastered, so correctness and idempotency matter
// more than anything else here.

function eventId(learnerId: string, competencyId: string): string {
  // Deterministic id derived from the unique pair. Combined with the
  // [learnerId+competencyId] unique index this makes recording idempotent: the
  // same demonstration always maps to the same row.
  return `${learnerId}::${competencyId}`;
}

/**
 * Record that a learner demonstrated a competency. Idempotent: re-recording an
 * existing (learnerId, competencyId) keeps the original row (and its original
 * demonstratedAt) rather than duplicating or overwriting it.
 *
 * Returns true if a new event was written, false if it already existed.
 */
export async function recordCompetency(
  learnerId: string,
  competencyId: string,
  lessonId: string,
  demonstratedAt: number = Date.now(),
): Promise<boolean> {
  if (!isCompetencyId(competencyId)) {
    throw new Error(`Cannot record unknown competency: ${competencyId}`);
  }

  return db.transaction('rw', db.competencyEvents, async () => {
    const existing = await db.competencyEvents
      .where('[learnerId+competencyId]')
      .equals([learnerId, competencyId])
      .first();
    if (existing) return false;

    const event: CompetencyEvent = {
      id: eventId(learnerId, competencyId),
      learnerId,
      competencyId,
      lessonId,
      demonstratedAt,
    };
    await db.competencyEvents.add(event);
    return true;
  });
}

/**
 * Record several competencies for one learner from one lesson, idempotently.
 * Returns the count of competencies newly recorded.
 */
export async function recordCompetencies(
  learnerId: string,
  competencyIds: readonly string[],
  lessonId: string,
  demonstratedAt: number = Date.now(),
): Promise<number> {
  let newlyRecorded = 0;
  for (const competencyId of competencyIds) {
    const created = await recordCompetency(learnerId, competencyId, lessonId, demonstratedAt);
    if (created) newlyRecorded += 1;
  }
  return newlyRecorded;
}

/** The set of competency ids a single learner has demonstrated. */
export async function getDemonstratedCompetencyIds(
  learnerId: string,
): Promise<Set<string>> {
  const events = await db.competencyEvents.where('learnerId').equals(learnerId).toArray();
  return new Set(events.map((e) => e.competencyId));
}

export interface LearnerGridRow {
  learnerId: string;
  /** competencyId -> demonstrated? for every competency in the framework. */
  demonstrated: Record<string, boolean>;
  demonstratedCount: number;
  totalCount: number;
  /** 0–100, rounded. */
  completionPercent: number;
}

/**
 * Build the facilitator grid: for each given learner, which of the framework's
 * competencies they have demonstrated, plus a completion percentage. Reads live
 * from the database.
 */
export async function getLearnerGrid(
  learnerIds: readonly string[],
): Promise<LearnerGridRow[]> {
  const total = COMPETENCIES.length;
  const rows: LearnerGridRow[] = [];

  for (const learnerId of learnerIds) {
    const done = await getDemonstratedCompetencyIds(learnerId);
    const demonstrated: Record<string, boolean> = {};
    for (const competency of COMPETENCIES) {
      demonstrated[competency.id] = done.has(competency.id);
    }
    const demonstratedCount = COMPETENCIES.reduce(
      (n, c) => (done.has(c.id) ? n + 1 : n),
      0,
    );
    rows.push({
      learnerId,
      demonstrated,
      demonstratedCount,
      totalCount: total,
      completionPercent: total === 0 ? 0 : Math.round((demonstratedCount / total) * 100),
    });
  }

  return rows;
}
