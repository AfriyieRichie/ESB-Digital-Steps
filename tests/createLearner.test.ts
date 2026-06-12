import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/data/db';
import { createLearner } from '../src/learner/createLearner';

beforeEach(async () => {
  await db.learners.clear();
  await db.hubs.clear();
});

describe('createLearner (onboarding)', () => {
  it('creates a learner with a trimmed name and the seeded hub', async () => {
    const learner = await createLearner({ name: '  Akosua  ', band: 2, avatar: 1 });

    expect(learner.name).toBe('Akosua');
    expect(learner.band).toBe(2);
    expect(learner.avatar).toBe(1);
    expect(learner.hubId).toBe('hub-1');
    expect(learner.id).toMatch(/^learner-/);

    const stored = await db.learners.get(learner.id);
    expect(stored?.name).toBe('Akosua');
  });

  it('gives each new learner a unique id', async () => {
    const a = await createLearner({ name: 'Kwame', band: 1, avatar: 0 });
    const b = await createLearner({ name: 'Kwame', band: 1, avatar: 0 });
    expect(a.id).not.toBe(b.id);
    expect(await db.learners.count()).toBe(2);
  });

  it('rejects a blank name', async () => {
    await expect(createLearner({ name: '   ', band: 1, avatar: 0 })).rejects.toThrow(/first name/i);
    expect(await db.learners.count()).toBe(0);
  });

  it('stores only privacy-safe fields (no PII beyond a first name)', async () => {
    const learner = await createLearner({ name: 'Esi', band: 3, avatar: 2 });
    expect(Object.keys(learner).sort()).toEqual(
      ['avatar', 'band', 'createdAt', 'hubId', 'id', 'name'].sort(),
    );
  });
});
