import { beforeEach, describe, expect, it } from 'vitest';
import { db, type Learner } from '../src/data/db';
import { recordCompetency } from '../src/data/events';
import { runSync } from '../src/data/sync/engine';
import { MemorySyncAdapter } from '../src/data/sync/adapters/memory';

async function addLearner(id: string, name: string): Promise<void> {
  const learner: Learner = { id, name, band: 1, avatar: 0, hubId: 'hub-1', createdAt: 1000 };
  await db.learners.add(learner);
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

describe('sync engine through an adapter', () => {
  it('pushes a device snapshot, then merges it onto an empty device', async () => {
    const adapter = new MemorySyncAdapter();

    // Device 1 has a learner with mastery; first sync publishes it.
    await addLearner('learner-ama', 'Ama');
    await recordCompetency('learner-ama', 'u_tap', 'tap');
    const first = await runSync(adapter);
    expect(first.pulled).toBeNull();
    expect(first.pushed).toBe(true);

    // A second (empty) device sharing the same target pulls + merges it.
    await clearAll();
    const second = await runSync(adapter);
    expect(second.pulled?.learnersAdded).toBe(1);
    expect(await db.learners.get('learner-ama')).toBeDefined();
    expect(await db.competencyEvents.count()).toBe(1);

    // Idempotent: syncing again adds nothing new.
    const third = await runSync(adapter);
    expect(third.pulled?.learnersAdded).toBe(0);
    expect(await db.learners.count()).toBe(1);
  });

  it('converges learners added on different devices', async () => {
    const adapter = new MemorySyncAdapter();

    // Device A adds Ama and syncs.
    await addLearner('learner-ama', 'Ama');
    await runSync(adapter);

    // Device B (separately) adds Kofi and syncs — it should end up with both.
    await clearAll();
    await addLearner('learner-kofi', 'Kofi');
    await runSync(adapter);

    const names = (await db.learners.toArray()).map((l) => l.name).sort();
    expect(names).toEqual(['Ama', 'Kofi']);
  });
});
