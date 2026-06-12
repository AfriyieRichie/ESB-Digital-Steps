import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/data/db';
import { createLearner, deleteLearner, updateLearner } from '../src/learner/createLearner';

beforeEach(async () => {
  await Promise.all([
    db.learners.clear(),
    db.hubs.clear(),
    db.competencyEvents.clear(),
    db.attempts.clear(),
    db.learnerProgress.clear(),
    db.awards.clear(),
    db.inventory.clear(),
  ]);
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

  it('stores only the core fields when no optional profile is given', async () => {
    const learner = await createLearner({ name: 'Esi', band: 3, avatar: 2 });
    expect(Object.keys(learner).sort()).toEqual(
      ['avatar', 'band', 'createdAt', 'hubId', 'id', 'name'].sort(),
    );
  });

  it('stores optional grade / age / school when provided', async () => {
    const learner = await createLearner({
      name: 'Kofi',
      band: 2,
      avatar: 0,
      grade: 3,
      age: 9,
      school: '  Hope Basic School  ',
    });
    expect(learner.grade).toBe(3);
    expect(learner.age).toBe(9);
    expect(learner.school).toBe('Hope Basic School'); // trimmed
  });
});

describe('updateLearner', () => {
  it('changes fields and clears optionals that are omitted', async () => {
    const learner = await createLearner({ name: 'Ama', band: 1, avatar: 0, grade: 1, school: 'Old School' });
    await updateLearner(learner.id, { name: 'Ama B', band: 2, avatar: 3 });

    const updated = await db.learners.get(learner.id);
    expect(updated?.name).toBe('Ama B');
    expect(updated?.band).toBe(2);
    expect(updated?.avatar).toBe(3);
    expect(updated?.grade).toBeUndefined();
    expect(updated?.school).toBeUndefined();
    // Identity is preserved.
    expect(updated?.id).toBe(learner.id);
    expect(updated?.createdAt).toBe(learner.createdAt);
  });
});

describe('deleteLearner (right to be forgotten)', () => {
  it('removes the learner and cascades all of their data', async () => {
    const learner = await createLearner({ name: 'Yaw', band: 1, avatar: 0 });
    await db.competencyEvents.add({
      id: `${learner.id}::u_tap`,
      learnerId: learner.id,
      competencyId: 'u_tap',
      lessonId: 'tap',
      demonstratedAt: Date.now(),
    });
    await db.attempts.add({
      learnerId: learner.id,
      skillId: 'u_tap',
      lessonId: 'tap',
      correct: true,
      ms: 100,
      at: Date.now(),
    });
    await db.learnerProgress.put({
      learnerId: learner.id,
      xp: 10,
      stars: 5,
      totalStarsEarned: 5,
      lessonsCompleted: 1,
      skillsMastered: 1,
      streakDays: 1,
      lastActiveDay: 0,
      updatedAt: Date.now(),
    });

    await deleteLearner(learner.id);

    expect(await db.learners.get(learner.id)).toBeUndefined();
    expect(await db.competencyEvents.where('learnerId').equals(learner.id).count()).toBe(0);
    expect(await db.attempts.where('learnerId').equals(learner.id).count()).toBe(0);
    expect(await db.learnerProgress.get(learner.id)).toBeUndefined();
  });
});
