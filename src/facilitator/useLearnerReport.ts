import { useEffect, useState } from 'react';
import { db, type Learner } from '../data/db';
import { COMPETENCIES } from '../data/competencies';
import { getDemonstratedCompetencyIds } from '../data/events';
import { learnerSummary, skillStatsForLearner } from '../data/attempts';
import { getProgress, listAwards } from '../gamification/progress';
import type { Badge } from '../gamification/badges';
import { buildSubjectBreakdown, overallMasteryPercent, type SubjectBreakdown } from './report';

export interface LearnerReportData {
  learner: Learner;
  masteredCount: number;
  totalCount: number;
  masteryPercent: number;
  accuracyPercent: number | null;
  timeOnTaskSeconds: number;
  streakDays: number;
  stars: number;
  xp: number;
  badges: Badge[];
  subjects: SubjectBreakdown[];
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: LearnerReportData }
  | { status: 'error'; error: Error };

/** Assembles one learner's full progress report live from on-device data. */
export function useLearnerReport(learnerId: string): LoadState {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const learner = await db.learners.get(learnerId);
        if (!learner) throw new Error('Learner not found.');

        const mastered = await getDemonstratedCompetencyIds(learnerId);
        const summary = await learnerSummary(learnerId);
        const progress = await getProgress(learnerId);
        const badges = await listAwards(learnerId);
        const skillStats = await skillStatsForLearner(learnerId);

        const data: LearnerReportData = {
          learner,
          masteredCount: mastered.size,
          totalCount: COMPETENCIES.length,
          masteryPercent: overallMasteryPercent(mastered),
          accuracyPercent: summary.attempts === 0 ? null : Math.round(summary.accuracy * 100),
          timeOnTaskSeconds: Math.round(summary.totalMs / 1000),
          streakDays: progress.streakDays,
          stars: progress.stars,
          xp: progress.xp,
          badges,
          subjects: buildSubjectBreakdown(mastered, skillStats),
        };
        if (!cancelled) setState({ status: 'ready', data });
      } catch (err) {
        if (!cancelled) {
          setState({ status: 'error', error: err instanceof Error ? err : new Error(String(err)) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  return state;
}
