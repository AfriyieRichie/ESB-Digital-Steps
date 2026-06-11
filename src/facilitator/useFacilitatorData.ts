import { useEffect, useState } from 'react';
import { db, ensureSeedData, type Learner } from '../data/db';
import { getLearnerGrid, type LearnerGridRow } from '../data/events';

export interface FacilitatorData {
  learners: Learner[];
  grid: Map<string, LearnerGridRow>;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: FacilitatorData }
  | { status: 'error'; error: Error };

/**
 * Loads the live facilitator dataset from Dexie: every learner plus their
 * competency grid row. Reads on mount, so navigating into the dashboard always
 * reflects the latest recorded progress.
 */
export function useFacilitatorData(): LoadState {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSeedData();
        const learners = await db.learners.orderBy('band').toArray();
        const rows = await getLearnerGrid(learners.map((l) => l.id));
        const grid = new Map(rows.map((r) => [r.learnerId, r]));
        if (!cancelled) setState({ status: 'ready', data: { learners, grid } });
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
