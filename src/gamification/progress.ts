import { db, type Award, type InventoryItem, type LearnerProgress } from '../data/db';
import { applyCompletion, canAfford, dayNumber, EMPTY_PROGRESS, type ProgressSnapshot } from './economy';
import { getBadge, qualifyingBadges, type Badge } from './badges';
import { getVillagePiece, type VillagePiece } from './village';

// The on-device gamification service: turns learning into stars/XP/streak/badges
// and lets stars be spent on village pieces. All writes are on-device and the
// idempotent ids on awards/inventory keep re-entry safe.

function emptyProgress(learnerId: string): LearnerProgress {
  return { learnerId, ...EMPTY_PROGRESS, updatedAt: 0 };
}

export async function getProgress(learnerId: string): Promise<LearnerProgress> {
  const found = await db.learnerProgress.get(learnerId);
  return found ?? emptyProgress(learnerId);
}

function snapshotOf(p: LearnerProgress): ProgressSnapshot {
  const { learnerId: _learnerId, updatedAt: _updatedAt, ...snapshot } = p;
  return snapshot;
}

export interface RewardSummary {
  newlyMastered: number;
  starsEarned: number;
  xpEarned: number;
  streakDays: number;
  totalStars: number;
  newBadges: Badge[];
}

/**
 * Apply one completed activity for a learner: award stars + XP, update the
 * streak, grant any newly-qualifying badges (idempotently), and return a summary
 * for the reward screen. `at` is injectable for testing.
 */
export async function applyActivityReward(
  learnerId: string,
  opts: { newlyMastered: number; at?: number },
): Promise<RewardSummary> {
  const at = opts.at ?? Date.now();
  const today = dayNumber(at);

  return db.transaction('rw', db.learnerProgress, db.awards, async () => {
    const current = await getProgress(learnerId);
    const { next, starsEarned, xpEarned } = applyCompletion(snapshotOf(current), {
      newlyMastered: opts.newlyMastered,
      today,
    });

    const saved: LearnerProgress = { learnerId, ...next, updatedAt: at };
    await db.learnerProgress.put(saved);

    // Award any badge that now qualifies and isn't already held.
    const existing = new Set((await db.awards.where('learnerId').equals(learnerId).toArray()).map((a) => a.badgeId));
    const newBadges: Badge[] = [];
    for (const badge of qualifyingBadges(next)) {
      if (existing.has(badge.id)) continue;
      const award: Award = {
        id: `${learnerId}::${badge.id}`,
        learnerId,
        badgeId: badge.id,
        awardedAt: at,
      };
      await db.awards.add(award);
      newBadges.push(badge);
    }

    return {
      newlyMastered: Math.max(0, opts.newlyMastered),
      starsEarned,
      xpEarned,
      streakDays: next.streakDays,
      totalStars: next.stars,
      newBadges,
    };
  });
}

export async function listAwards(learnerId: string): Promise<Badge[]> {
  const rows = await db.awards.where('learnerId').equals(learnerId).toArray();
  return rows.map((r) => getBadge(r.badgeId));
}

export async function listInventory(learnerId: string): Promise<VillagePiece[]> {
  const rows = await db.inventory.where('learnerId').equals(learnerId).toArray();
  return rows.map((r) => getVillagePiece(r.pieceId));
}

export type PurchaseResult =
  | { ok: true; stars: number }
  | { ok: false; reason: 'owned' | 'insufficient' };

/**
 * Buy a village piece: deduct its cost from the spendable star balance and add
 * it to the learner's inventory. Idempotent-safe: owning a piece twice is
 * rejected rather than double-charged.
 */
export async function purchasePiece(learnerId: string, pieceId: string): Promise<PurchaseResult> {
  const piece = getVillagePiece(pieceId);
  return db.transaction('rw', db.learnerProgress, db.inventory, async () => {
    const owned = await db.inventory.get(`${learnerId}::${pieceId}`);
    if (owned) return { ok: false, reason: 'owned' };

    const progress = await getProgress(learnerId);
    if (!canAfford(progress.stars, piece.cost)) return { ok: false, reason: 'insufficient' };

    const updated: LearnerProgress = {
      ...progress,
      stars: progress.stars - piece.cost,
      updatedAt: Date.now(),
    };
    await db.learnerProgress.put(updated);

    const item: InventoryItem = {
      id: `${learnerId}::${pieceId}`,
      learnerId,
      pieceId,
      acquiredAt: Date.now(),
    };
    await db.inventory.add(item);

    return { ok: true, stars: updated.stars };
  });
}
