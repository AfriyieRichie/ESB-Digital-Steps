import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/data/db';
import {
  getDemonstratedCompetencyIds,
  getLearnerGrid,
  recordCompetencies,
  recordCompetency,
} from '../src/data/events';
import { COMPETENCIES } from '../src/data/competencies';

const TOTAL = COMPETENCIES.length;

beforeEach(async () => {
  // Each test starts from an empty event store (the Dexie singleton is shared
  // across the file). We only touch competencyEvents here.
  await db.competencyEvents.clear();
});

describe('recordCompetency', () => {
  it('writes a single event the first time a competency is demonstrated', async () => {
    const created = await recordCompetency('learner-ama', 'u_tap', 'tap');
    expect(created).toBe(true);

    const events = await db.competencyEvents.toArray();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      learnerId: 'learner-ama',
      competencyId: 'u_tap',
      lessonId: 'tap',
    });
  });

  it('is idempotent: re-recording the same pair does not duplicate the row', async () => {
    const first = await recordCompetency('learner-ama', 'u_tap', 'tap', 1000);
    const second = await recordCompetency('learner-ama', 'u_tap', 'tap', 2000);

    expect(first).toBe(true);
    expect(second).toBe(false);

    const events = await db.competencyEvents
      .where('learnerId')
      .equals('learner-ama')
      .toArray();
    expect(events).toHaveLength(1);
    // The original demonstratedAt is preserved, not overwritten.
    expect(events[0]?.demonstratedAt).toBe(1000);
  });

  it('keeps the same competency separate per learner', async () => {
    await recordCompetency('learner-ama', 'u_tap', 'tap');
    await recordCompetency('learner-kofi', 'u_tap', 'tap');

    expect(await db.competencyEvents.count()).toBe(2);
  });

  it('rejects competencies that are not in the framework', async () => {
    await expect(recordCompetency('learner-ama', 'not_a_real_one', 'tap')).rejects.toThrow(
      /unknown competency/i,
    );
  });
});

describe('recordCompetencies', () => {
  it('records each new competency once and reports the count newly recorded', async () => {
    const lessonCompetencies = ['u_power', 'u_tap'];

    const firstRun = await recordCompetencies('learner-ama', lessonCompetencies, 'tap');
    expect(firstRun).toBe(2);

    // Completing the same lesson again adds nothing new.
    const secondRun = await recordCompetencies('learner-ama', lessonCompetencies, 'tap');
    expect(secondRun).toBe(0);

    const done = await getDemonstratedCompetencyIds('learner-ama');
    expect(done).toEqual(new Set(['u_power', 'u_tap']));
  });
});

describe('getLearnerGrid', () => {
  it('reports demonstrated competencies and completion percentage per learner', async () => {
    await recordCompetencies('learner-ama', ['u_power', 'u_tap'], 'tap');

    const grid = await getLearnerGrid(['learner-ama', 'learner-kofi']);
    const ama = grid.find((r) => r.learnerId === 'learner-ama');
    const kofi = grid.find((r) => r.learnerId === 'learner-kofi');

    expect(ama?.demonstrated.u_power).toBe(true);
    expect(ama?.demonstrated.u_tap).toBe(true);
    expect(ama?.demonstrated.c_share).toBe(false);
    expect(ama?.demonstratedCount).toBe(2);
    expect(ama?.totalCount).toBe(TOTAL);
    expect(ama?.completionPercent).toBe(Math.round((2 / TOTAL) * 100));

    // A learner with no events is at 0%.
    expect(kofi?.demonstratedCount).toBe(0);
    expect(kofi?.completionPercent).toBe(0);
  });

  it('covers every competency in the framework as a column', async () => {
    const [row] = await getLearnerGrid(['learner-esi']);
    expect(Object.keys(row?.demonstrated ?? {})).toHaveLength(TOTAL);
  });
});
