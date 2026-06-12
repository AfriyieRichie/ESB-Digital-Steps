import { beforeEach, describe, expect, it } from 'vitest';
import { db, type Learner } from '../src/data/db';
import { recordCompetency } from '../src/data/events';
import { applyActivityReward } from '../src/gamification/progress';
import { exportHubData, importHubData, parseBackup } from '../src/data/backup';

// Insert learners directly (not via createLearner) to avoid the first-run seed,
// keeping the merge counts deterministic.
async function addLearner(id: string, name: string, extra: Partial<Learner> = {}): Promise<Learner> {
  const learner: Learner = { id, name, band: 1, avatar: 0, hubId: 'hub-1', createdAt: 1000, ...extra };
  await db.learners.add(learner);
  return learner;
}

async function clearAll(): Promise<void> {
  await Promise.all([
    db.hubs.clear(),
    db.learners.clear(),
    db.competencyEvents.clear(),
    db.attempts.clear(),
    db.learnerProgress.clear(),
    db.awards.clear(),
    db.inventory.clear(),
  ]);
}

beforeEach(clearAll);

describe('hub data backup', () => {
  it('rejects a non-backup file with a clear error', () => {
    expect(() => parseBackup('not json')).toThrow(/valid JSON/i);
    expect(() => parseBackup('{"version":9}')).toThrow(/ESB hub data/i);
  });

  it('exports learners + mastery and merges them onto another (empty) device', async () => {
    await addLearner('learner-ama', 'Ama', { school: 'Hope' });
    await recordCompetency('learner-ama', 'u_tap', 'tap');
    await applyActivityReward('learner-ama', { newlyMastered: 1 });
    const bundle = await exportHubData();

    await clearAll();
    const result = await importHubData(bundle.json);

    expect(result.learnersAdded).toBe(1);
    expect(result.competenciesAdded).toBeGreaterThanOrEqual(1);

    const imported = await db.learners.get('learner-ama');
    expect(imported?.name).toBe('Ama');
    expect(imported?.school).toBe('Hope');
    expect(await db.competencyEvents.where('learnerId').equals('learner-ama').count()).toBe(1);
  });

  it('is idempotent — importing the same file twice does not duplicate', async () => {
    await addLearner('learner-kofi', 'Kofi');
    await recordCompetency('learner-kofi', 'u_power', 'tap');
    const bundle = await exportHubData();

    await clearAll();
    const first = await importHubData(bundle.json);
    const second = await importHubData(bundle.json);

    expect(first.learnersAdded).toBe(1);
    expect(first.competenciesAdded).toBe(1);
    expect(second.learnersAdded).toBe(0);
    expect(second.competenciesAdded).toBe(0);
    expect(await db.learners.count()).toBe(1);
    expect(await db.competencyEvents.count()).toBe(1);
  });

  it('keeps the earliest demonstration when merging the same competency', async () => {
    await addLearner('learner-esi', 'Esi', { band: 2 });
    await recordCompetency('learner-esi', 'u_tap', 'tap', 5000);
    const bundle = await exportHubData();

    // Locally the same skill was demonstrated later; import should keep earlier.
    await db.competencyEvents.clear();
    await recordCompetency('learner-esi', 'u_tap', 'tap', 9000);
    await importHubData(bundle.json);

    const event = await db.competencyEvents.get('learner-esi::u_tap');
    expect(event?.demonstratedAt).toBe(5000);
  });
});
