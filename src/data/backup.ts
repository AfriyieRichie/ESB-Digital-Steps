import {
  db,
  type Award,
  type CompetencyEvent,
  type Hub,
  type InventoryItem,
  type Learner,
  type LearnerProgress,
} from './db';

// File-based hub data transfer: export every learner + their mastery/progress
// from one device and merge it into another. This is the offline, USB-friendly
// way to share profiles across the tablets in a hub today, and the foundation
// for any future automatic sync. It carries the durable, id-keyed records
// (which merge idempotently); raw per-attempt timings stay device-local until
// real sync exists, so importing the same file twice never double-counts.

export interface HubBackup {
  version: 1;
  exportedAt: string;
  hubs: Hub[];
  learners: Learner[];
  competencyEvents: CompetencyEvent[];
  learnerProgress: LearnerProgress[];
  awards: Award[];
  inventory: InventoryItem[];
}

export interface ExportBundle {
  json: string;
  filenameBase: string;
}

/**
 * The device's full syncable snapshot. This is the single primitive both the
 * file export and the sync engine build on (see data/sync/).
 */
export async function snapshotHubData(at: number = Date.now()): Promise<HubBackup> {
  return {
    version: 1,
    exportedAt: new Date(at).toISOString(),
    hubs: await db.hubs.toArray(),
    learners: await db.learners.toArray(),
    competencyEvents: await db.competencyEvents.toArray(),
    learnerProgress: await db.learnerProgress.toArray(),
    awards: await db.awards.toArray(),
    inventory: await db.inventory.toArray(),
  };
}

export async function exportHubData(at: number = Date.now()): Promise<ExportBundle> {
  const backup = await snapshotHubData(at);
  return {
    json: JSON.stringify(backup, null, 2),
    filenameBase: `esb-hub-data-${backup.exportedAt.slice(0, 10)}`,
  };
}

export interface ImportResult {
  learnersAdded: number;
  learnersUpdated: number;
  competenciesAdded: number;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Parse + lightly validate a backup file, throwing a clear error on bad input. */
export function parseBackup(json: string): HubBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!raw || typeof raw !== 'object' || (raw as { version?: unknown }).version !== 1) {
    throw new Error('This is not an ESB hub data file.');
  }
  const r = raw as Record<string, unknown>;
  return {
    version: 1,
    exportedAt: typeof r.exportedAt === 'string' ? r.exportedAt : '',
    hubs: asArray<Hub>(r.hubs),
    learners: asArray<Learner>(r.learners),
    competencyEvents: asArray<CompetencyEvent>(r.competencyEvents),
    learnerProgress: asArray<LearnerProgress>(r.learnerProgress),
    awards: asArray<Award>(r.awards),
    inventory: asArray<InventoryItem>(r.inventory),
  };
}

/**
 * Merge a snapshot into this device. Idempotent:
 * - hubs/learners: upserted by id;
 * - competency events: unioned by id, keeping the earliest demonstration;
 * - progress: last-writer-wins by updatedAt;
 * - awards/inventory: unioned by id (never duplicated).
 *
 * This is the merge primitive the sync engine uses; importHubData just parses a
 * file and calls it.
 */
export async function mergeHubData(data: HubBackup): Promise<ImportResult> {
  const result: ImportResult = { learnersAdded: 0, learnersUpdated: 0, competenciesAdded: 0 };

  await db.transaction(
    'rw',
    [db.hubs, db.learners, db.competencyEvents, db.learnerProgress, db.awards, db.inventory],
    async () => {
      for (const hub of data.hubs) {
        await db.hubs.put(hub);
      }

      for (const learner of data.learners) {
        const existing = await db.learners.get(learner.id);
        await db.learners.put(learner);
        if (existing) result.learnersUpdated += 1;
        else result.learnersAdded += 1;
      }

      for (const event of data.competencyEvents) {
        const existing = await db.competencyEvents.get(event.id);
        if (!existing) {
          await db.competencyEvents.add(event);
          result.competenciesAdded += 1;
        } else if (event.demonstratedAt < existing.demonstratedAt) {
          await db.competencyEvents.put({ ...existing, demonstratedAt: event.demonstratedAt });
        }
      }

      for (const progress of data.learnerProgress) {
        const existing = await db.learnerProgress.get(progress.learnerId);
        if (!existing || progress.updatedAt > existing.updatedAt) {
          await db.learnerProgress.put(progress);
        }
      }

      for (const award of data.awards) {
        if (!(await db.awards.get(award.id))) await db.awards.add(award);
      }

      for (const item of data.inventory) {
        if (!(await db.inventory.get(item.id))) await db.inventory.add(item);
      }
    },
  );

  return result;
}

/** Parse a backup file and merge it into this device. */
export async function importHubData(json: string): Promise<ImportResult> {
  return mergeHubData(parseBackup(json));
}
