import { beforeEach, describe, expect, it } from 'vitest';
import { db, type LearnerProgress } from '../src/data/db';
import { EMPTY_PROGRESS } from '../src/gamification/economy';
import {
  applyActivityReward,
  getProgress,
  listInventory,
  purchasePiece,
} from '../src/gamification/progress';

const AMA = 'learner-ama';
const day = (y: number, m: number, d: number): number => new Date(y, m, d, 12, 0, 0).getTime();

beforeEach(async () => {
  await Promise.all([db.learnerProgress.clear(), db.awards.clear(), db.inventory.clear()]);
});

describe('applyActivityReward', () => {
  it('awards stars/XP and the first-time badges', async () => {
    const reward = await applyActivityReward(AMA, { newlyMastered: 2, at: day(2026, 2, 1) });

    expect(reward.starsEarned).toBe(1 + 3 * 2);
    expect(reward.xpEarned).toBe(10 + 5 * 2);
    expect(reward.streakDays).toBe(1);
    expect(reward.totalStars).toBe(7);
    expect(reward.newBadges.map((b) => b.id).sort()).toEqual(['first_steps', 'sharp_mind']);

    const progress = await getProgress(AMA);
    expect(progress.skillsMastered).toBe(2);
    expect(progress.lessonsCompleted).toBe(1);
  });

  it('does not re-award a badge already earned', async () => {
    await applyActivityReward(AMA, { newlyMastered: 1, at: day(2026, 2, 1) });
    const second = await applyActivityReward(AMA, { newlyMastered: 0, at: day(2026, 2, 1) });
    expect(second.newBadges).toEqual([]);
    expect(await db.awards.where('learnerId').equals(AMA).count()).toBe(2); // first_steps + sharp_mind, once each
  });

  it('builds a streak across consecutive days and grants On a Roll on day 3', async () => {
    const d1 = await applyActivityReward(AMA, { newlyMastered: 0, at: day(2026, 2, 1) });
    const d2 = await applyActivityReward(AMA, { newlyMastered: 0, at: day(2026, 2, 2) });
    const d3 = await applyActivityReward(AMA, { newlyMastered: 0, at: day(2026, 2, 3) });

    expect([d1.streakDays, d2.streakDays, d3.streakDays]).toEqual([1, 2, 3]);
    expect(d3.newBadges.map((b) => b.id)).toContain('on_a_roll');
  });
});

describe('purchasePiece', () => {
  async function giveStars(stars: number): Promise<void> {
    const progress: LearnerProgress = {
      learnerId: AMA,
      ...EMPTY_PROGRESS,
      stars,
      totalStarsEarned: stars,
      updatedAt: Date.now(),
    };
    await db.learnerProgress.put(progress);
  }

  it('rejects a purchase the learner cannot afford', async () => {
    await giveStars(3);
    const result = await purchasePiece(AMA, 'market'); // costs 12
    expect(result).toEqual({ ok: false, reason: 'insufficient' });
    expect(await listInventory(AMA)).toEqual([]);
  });

  it('buys a piece, deducts stars, and adds it to the village', async () => {
    await giveStars(10);
    const result = await purchasePiece(AMA, 'tree'); // costs 4
    expect(result).toEqual({ ok: true, stars: 6 });

    const inventory = await listInventory(AMA);
    expect(inventory.map((p) => p.id)).toEqual(['tree']);
    expect((await getProgress(AMA)).stars).toBe(6);
  });

  it('does not let the same piece be bought twice', async () => {
    await giveStars(20);
    await purchasePiece(AMA, 'tree');
    const again = await purchasePiece(AMA, 'tree');
    expect(again).toEqual({ ok: false, reason: 'owned' });
    expect((await getProgress(AMA)).stars).toBe(16); // charged once only
  });
});
