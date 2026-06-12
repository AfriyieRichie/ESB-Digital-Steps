import { useEffect, useState } from 'react';
import { db, ensureSeedData, type Learner } from '../data/db';
import { getLearnerGrid, type LearnerGridRow } from '../data/events';
import { learnerSummary, type LearnerSummary } from '../data/attempts';

export interface FacilitatorData {
  learners: Learner[];
  grid: Map<string, LearnerGridRow>;
  /** Per-learner roll-up of the attempt log (accuracy, time-on-task, …). */
  summaries: Map<string, LearnerSummary>;
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
export function useFacilitatorData(reloadToken = 0): LoadState {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSeedData();
        const learners = await db.learners.orderBy('band').toArray();
        const learnerIds = learners.map((l) => l.id);
        const rows = await getLearnerGrid(learnerIds);
        const grid = new Map(rows.map((r) => [r.learnerId, r]));
        const summaryEntries = await Promise.all(
          learnerIds.map(async (id): Promise<[string, LearnerSummary]> => [id, await learnerSummary(id)]),
        );
        const summaries = new Map(summaryEntries);
        if (!cancelled) setState({ status: 'ready', data: { learners, grid, summaries } });
      } catch (err) {
        if (!cancelled) {
          setState({ status: 'error', error: err instanceof Error ? err : new Error(String(err)) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return state;
}
