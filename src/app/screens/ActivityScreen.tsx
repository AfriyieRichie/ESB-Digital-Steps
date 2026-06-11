import { useCallback } from 'react';
import { getLesson } from '../../content/lessons';
import { ACTIVITY_REGISTRY } from '../../activities/registry';
import { recordCompetencies } from '../../data/events';
import { useCurrentLearner } from '../../learner/store';
import { useAppStore } from '../store';

/**
 * The single wrapper that plays any activity. It looks up the activity component
 * by the lesson's activityType, hands it the validated config, and — when the
 * activity reports completion — records the lesson's competencies for the
 * current learner (idempotently) and advances to the reward screen.
 *
 * Activities themselves know nothing about learners or persistence; all of that
 * lives here, so new activity types need no new plumbing.
 */
export function ActivityScreen(): React.JSX.Element {
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const finishActivity = useAppStore((s) => s.finishActivity);
  const currentLearnerId = useCurrentLearner((s) => s.currentLearnerId);

  const lesson = activeLessonId !== null ? getLesson(activeLessonId) : null;

  const onComplete = useCallback(() => {
    if (!lesson || currentLearnerId === null) return;
    void (async () => {
      const newlyRecorded = await recordCompetencies(
        currentLearnerId,
        lesson.competencies,
        lesson.id,
      );
      finishActivity(newlyRecorded);
    })();
  }, [lesson, currentLearnerId, finishActivity]);

  if (!lesson) {
    return <p>Choose a lesson to begin.</p>;
  }

  const ActivityComponent = ACTIVITY_REGISTRY[lesson.activityType];

  return (
    <section className="activity-screen" aria-label={lesson.title}>
      <ActivityComponent config={lesson.config} onComplete={onComplete} />
    </section>
  );
}
