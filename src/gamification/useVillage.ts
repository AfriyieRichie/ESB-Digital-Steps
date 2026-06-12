import { useCallback, useEffect, useState } from 'react';
import { getProgress, listInventory, purchasePiece } from './progress';

export interface VillageView {
  status: 'loading' | 'ready';
  stars: number;
  /** Owned village-piece ids. */
  owned: Set<string>;
  message: string | null;
  buy: (pieceId: string) => Promise<void>;
}

/** Live view of a learner's star balance and village, with buying wired in. */
export function useVillage(learnerId: string | null): VillageView {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [stars, setStars] = useState(0);
  const [owned, setOwned] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!learnerId) return;
    const progress = await getProgress(learnerId);
    const inventory = await listInventory(learnerId);
    setStars(progress.stars);
    setOwned(new Set(inventory.map((p) => p.id)));
    setStatus('ready');
  }, [learnerId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const buy = useCallback(
    async (pieceId: string) => {
      if (!learnerId) return;
      const result = await purchasePiece(learnerId, pieceId);
      if (result.ok) {
        setMessage(null);
        await reload();
      } else {
        setMessage(result.reason === 'insufficient' ? 'Not enough stars yet — keep learning!' : 'Already in your village.');
      }
    },
    [learnerId, reload],
  );

  return { status, stars, owned, message, buy };
}
