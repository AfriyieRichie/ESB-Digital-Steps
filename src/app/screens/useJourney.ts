import { useEffect, useState } from 'react';
import { lessonsForBand } from '../../content/lessons';
import { getDemonstratedCompetencyIds } from '../../data/events';
import { useLearner } from '../../learner/useLearners';
import { buildJourney, readyForNextBand, type LessonProgress } from '../../sequencing/progression';

export interface JourneyView {
  lessons: LessonProgress[];
  readyForNextBand: boolean;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; view: JourneyView };

/**
 * Builds the live journey for a learner: their band's lessons, ordered and
 * marked done / available / locked from the competencies they have mastered so
 * far, plus whether they are ready to move up a band. Re-reads whenever the
 * learner changes (e.g. after returning from a completed activity).
 */
export function useJourney(learnerId: string | null): LoadState {
  const learner = useLearner(learnerId);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    if (!learner) {
      setState({ status: 'loading' });
      return;
    }
    (async () => {
      const mastered = await getDemonstratedCompetencyIds(learner.id);
      const bandLessons = lessonsForBand(learner.band);
      const view: JourneyView = {
        lessons: buildJourney(bandLessons, mastered),
        readyForNextBand: readyForNextBand(learner.band, bandLessons, mastered),
      };
      if (!cancelled) setState({ status: 'ready', view });
    })();
    return () => {
      cancelled = true;
    };
  }, [learner]);

  return state;
}
