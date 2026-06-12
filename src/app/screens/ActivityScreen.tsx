import { useCallback, useState } from 'react';
import { getLesson } from '../../content/lessons';
import { ACTIVITY_REGISTRY } from '../../activities/registry';
import { recordCompetencies } from '../../data/events';
import { useCurrentLearner } from '../../learner/store';
import { useAppStore } from '../store';

/**
 * Plays a lesson as an ordered sequence of steps. For each step it looks up the
 * activity component by the step's activityType and hands it the validated
 * config. When a step reports completion it advances to the next; after the
 * final step it records the lesson's skills for the current learner
 * (idempotently) and moves to the reward screen.
 *
 * Activities themselves know nothing about learners, steps, or persistence — all
 * of that lives here, so new activity types need no new plumbing.
 */
export function ActivityScreen(): React.JSX.Element {
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const finishActivity = useAppStore((s) => s.finishActivity);
  const currentLearnerId = useCurrentLearner((s) => s.currentLearnerId);

  const lesson = activeLessonId !== null ? getLesson(activeLessonId) : null;
  const [stepIndex, setStepIndex] = useState(0);

  const recordAndFinish = useCallback(() => {
    if (!lesson || currentLearnerId === null) return;
    void (async () => {
      const newlyRecorded = await recordCompetencies(
        currentLearnerId,
        lesson.skills,
        lesson.id,
      );
      finishActivity(newlyRecorded);
    })();
  }, [lesson, currentLearnerId, finishActivity]);

  const onStepComplete = useCallback(() => {
    if (!lesson) return;
    if (stepIndex < lesson.steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      recordAndFinish();
    }
  }, [lesson, stepIndex, recordAndFinish]);

  if (!lesson) {
    return <p>Choose a lesson to begin.</p>;
  }

  const step = lesson.steps[stepIndex];
  if (!step) {
    return <p>This lesson has no steps to play.</p>;
  }

  const ActivityComponent = ACTIVITY_REGISTRY[step.activityType];

  return (
    <section className="activity-screen" aria-label={lesson.title}>
      {/* key on stepIndex so each step's activity mounts fresh. */}
      <ActivityComponent key={stepIndex} config={step.config} onComplete={onStepComplete} />
    </section>
  );
}
