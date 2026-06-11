import { useEffect, useState } from 'react';
import { db, ensureSeedData, type Learner } from '../data/db';

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: Error };

/**
 * Loads all learners for the hub from Dexie, seeding on first run. A simple
 * effect-based read keeps the dependency footprint small; the data is small and
 * changes rarely within a session.
 */
export function useLearners(): LoadState<Learner[]> {
  const [state, setState] = useState<LoadState<Learner[]>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSeedData();
        const learners = await db.learners.orderBy('band').toArray();
        if (!cancelled) setState({ status: 'ready', data: learners });
      } catch (err) {
        if (!cancelled) {
          setState({ status: 'error', error: err instanceof Error ? err : new Error(String(err)) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Loads a single learner by id (or null while loading / if not found). */
export function useLearner(learnerId: string | null): Learner | null {
  const [learner, setLearner] = useState<Learner | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (learnerId === null) {
      setLearner(null);
      return;
    }
    (async () => {
      const found = await db.learners.get(learnerId);
      if (!cancelled) setLearner(found ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  return learner;
}
