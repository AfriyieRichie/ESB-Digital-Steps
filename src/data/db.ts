import Dexie, { type EntityTable } from 'dexie';

// All stored data lives here, on the device, in IndexedDB via Dexie. This file
// is the schema's single source of truth. Bump the version() and add an
// upgrade() callback for any future shape change — never mutate an existing
// version's stores.

export type Band = 1 | 2 | 3;

export interface Hub {
  id: string;
  name: string;
}

export interface Learner {
  id: string;
  name: string;
  band: Band;
  avatar: number;
  hubId: string;
  createdAt: number;
}

export interface CompetencyEvent {
  id: string;
  learnerId: string;
  competencyId: string;
  lessonId: string;
  demonstratedAt: number;
}

// One row per item/action attempt — the raw evidence from which mastery is
// derived (see docs/CONTENT-ARCHITECTURE.md §3). Many rows per learner, so the
// id is an auto-incrementing number rather than a derived key.
export interface Attempt {
  id?: number;
  learnerId: string;
  skillId: string;
  lessonId: string;
  /** The specific content item, when the activity is item-based (optional). */
  itemId?: string;
  correct: boolean;
  /** Time spent on this attempt in milliseconds (for time-on-task reporting). */
  ms: number;
  at: number;
}

export interface Session {
  id: string;
  hubId: string;
  date: number;
  facilitatorName: string;
}

class EsbDatabase extends Dexie {
  hubs!: EntityTable<Hub, 'id'>;
  learners!: EntityTable<Learner, 'id'>;
  competencyEvents!: EntityTable<CompetencyEvent, 'id'>;
  sessions!: EntityTable<Session, 'id'>;
  attempts!: EntityTable<Attempt, 'id'>;

  constructor() {
    super('esb-digital-steps');

    // v1: the foundation schema.
    // The compound unique index [learnerId+competencyId] enforces the
    // "one row the first time a learner demonstrates a competency" rule at the
    // database level, which is what makes recording idempotent.
    this.version(1).stores({
      hubs: 'id, name',
      learners: 'id, hubId, band',
      competencyEvents: 'id, &[learnerId+competencyId], learnerId, competencyId, lessonId',
      sessions: 'id, hubId, date',
    });

    // v2: the attempt log (slice #2). Only the new table is declared; unchanged
    // tables carry over. The [learnerId+skillId] index makes per-skill mastery
    // queries cheap.
    this.version(2).stores({
      attempts: '++id, learnerId, skillId, lessonId, at, [learnerId+skillId]',
    });
  }
}

export const db = new EsbDatabase();

// --- First-run seed ----------------------------------------------------------
// One hub and four sample learners across bands. Idempotent: keyed on stable
// ids so re-running (e.g. a page reload) never duplicates rows.

const SEED_HUB: Hub = { id: 'hub-1', name: 'Community Hub 1' };

const SEED_LEARNERS: readonly Omit<Learner, 'createdAt'>[] = [
  { id: 'learner-ama', name: 'Ama', band: 1, avatar: 0, hubId: SEED_HUB.id },
  { id: 'learner-kofi', name: 'Kofi', band: 1, avatar: 1, hubId: SEED_HUB.id },
  { id: 'learner-esi', name: 'Esi', band: 2, avatar: 2, hubId: SEED_HUB.id },
  { id: 'learner-yaw', name: 'Yaw', band: 3, avatar: 3, hubId: SEED_HUB.id },
];

let seedPromise: Promise<void> | null = null;

export function ensureSeedData(database: EsbDatabase = db): Promise<void> {
  // Memoised so concurrent callers (e.g. multiple screens mounting) seed once.
  seedPromise ??= seed(database);
  return seedPromise;
}

async function seed(database: EsbDatabase): Promise<void> {
  await database.transaction('rw', database.hubs, database.learners, async () => {
    const hubCount = await database.hubs.count();
    if (hubCount === 0) {
      await database.hubs.add(SEED_HUB);
    }
    const learnerCount = await database.learners.count();
    if (learnerCount === 0) {
      const now = Date.now();
      await database.learners.bulkAdd(
        SEED_LEARNERS.map((l) => ({ ...l, createdAt: now })),
      );
    }
  });
}
