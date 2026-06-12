import { db, ensureSeedData } from './db';
import { COMPETENCIES } from './competencies';
import { getDemonstratedCompetencyIds } from './events';
import { learnerSummary } from './attempts';
import { getProgress, listAwards } from '../gamification/progress';
import {
  exportFilenameBase,
  toCsv,
  toJson,
  type ExportModel,
  type LearnerExport,
} from './exportModel';

// Funder-facing export of the on-device record. Reads everything live from
// Dexie and shapes it through the pure exportModel. No network — the caller
// turns the returned strings into a file the facilitator carries off the device
// (e.g. on a USB stick).

export interface ExportBundle {
  model: ExportModel;
  csv: string;
  json: string;
  filenameBase: string;
}

/** Collect the full progress export for every learner in the hub. */
export async function collectExport(at: number = Date.now()): Promise<ExportBundle> {
  await ensureSeedData();

  const hub = await db.hubs.toCollection().first();
  const learners = await db.learners.orderBy('band').toArray();
  const totalCompetencies = COMPETENCIES.length;
  const competencyIds = COMPETENCIES.map((c) => c.id);

  const learnerExports: LearnerExport[] = [];
  for (const learner of learners) {
    const mastered = await getDemonstratedCompetencyIds(learner.id);
    const summary = await learnerSummary(learner.id);
    const progress = await getProgress(learner.id);
    const badges = await listAwards(learner.id);

    const masteredIds = competencyIds.filter((id) => mastered.has(id));
    learnerExports.push({
      learnerId: learner.id,
      name: learner.name,
      band: learner.band,
      mastered: masteredIds,
      masteredCount: masteredIds.length,
      totalCompetencies,
      masteryPercent:
        totalCompetencies === 0 ? 0 : Math.round((masteredIds.length / totalCompetencies) * 100),
      attempts: summary.attempts,
      correct: summary.correct,
      accuracyPercent: summary.attempts === 0 ? null : Math.round(summary.accuracy * 100),
      timeOnTaskSeconds: Math.round(summary.totalMs / 1000),
      streakDays: progress.streakDays,
      stars: progress.stars,
      xp: progress.xp,
      badges: badges.map((b) => b.id),
    });
  }

  const model: ExportModel = {
    exportedAt: new Date(at).toISOString(),
    hubName: hub?.name ?? 'Unknown hub',
    competencyIds,
    learners: learnerExports,
  };

  return {
    model,
    csv: toCsv(model),
    json: toJson(model),
    filenameBase: exportFilenameBase(model.exportedAt),
  };
}
