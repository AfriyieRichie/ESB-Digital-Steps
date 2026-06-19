import { useCallback, useRef, useState } from 'react';
import { getLesson } from '../../content/lessons';
import { ACTIVITY_REGISTRY } from '../../activities/registry';
import type { AttemptResult } from '../../activities/engine.types';
import { recordAttempt } from '../../data/mastery';
import { applyActivityReward } from '../../gamification/progress';
import { useCurrentLearner } from '../../learner/store';
import { Mascot, type MascotMood } from '../../ui/Mascot';
import { useAppStore } from '../store';
import './ActivityScreen.css';

/**
 * Plays a lesson as an ordered sequence of steps. For each step it looks up the
 * activity component by the step's activityType and hands it the validated
 * config. Activities report graded actions through onAttempt; those are logged
 * against the lesson's skills, and mastery (the CompetencyEvent milestone) is
 * derived from the attempt log — completing a lesson no longer asserts mastery
 * by itself. After the final step it advances to the reward screen, telling it
 * how many skills were newly mastered this session.
 *
 * Activities know nothing about learners, steps, or persistence — all of that
 * lives here, so new activity types need no new plumbing.
 */
export function ActivityScreen(): React.JSX.Element {
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const finishActivity = useAppStore((s) => s.finishActivity);
  const currentLearnerId = useCurrentLearner((s) => s.currentLearnerId);

  const lesson = activeLessonId !== null ? getLesson(activeLessonId) : null;
  const [stepIndex, setStepIndex] = useState(0);

  // The buddy mascot's mood reacts to each answer (cheers right, encourages
  // wrong), then settles back to a gentle idle.
  const [mood, setMood] = useState<MascotMood>('happy');
  const moodTimer = useRef<number | null>(null);

  // In-flight attempt writes, and the set of skills mastered during this play —
  // tracked in refs so completion can await all writes before counting.
  const pending = useRef<Promise<void>[]>([]);
  const masteredThisSession = useRef<Set<string>>(new Set());

  const onAttempt = useCallback(
    (result: AttemptResult) => {
      if (!lesson || currentLearnerId === null) return;

      setMood(result.correct ? 'cheer' : 'oops');
      if (moodTimer.current !== null) window.clearTimeout(moodTimer.current);
      moodTimer.current = window.setTimeout(() => setMood('happy'), 1300);

      // Attribute to the item's own skills when the activity provides them,
      // otherwise to the whole lesson (e.g. the generative Tap activity).
      const skills = result.skills && result.skills.length > 0 ? result.skills : lesson.skills;
      const write = (async () => {
        const newly = await recordAttempt(currentLearnerId, skills, {
          correct: result.correct,
          ms: result.ms ?? 0,
          lessonId: lesson.id,
          ...(result.itemId !== undefined ? { itemId: result.itemId } : {}),
        });
        for (const skill of newly) masteredThisSession.current.add(skill);
      })();
      pending.current.push(write);
    },
    [lesson, currentLearnerId],
  );

  const onStepComplete = useCallback(() => {
    if (!lesson) return;
    if (stepIndex < lesson.steps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    // Final step: wait for every attempt write to settle, then apply the
    // gamification reward (stars/XP/streak/badges) and move to the reward screen.
    void (async () => {
      await Promise.all(pending.current);
      if (currentLearnerId === null) return;
      const reward = await applyActivityReward(currentLearnerId, {
        newlyMastered: masteredThisSession.current.size,
      });
      finishActivity(reward);
    })();
  }, [lesson, stepIndex, currentLearnerId, finishActivity]);

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
      <ActivityComponent
        key={stepIndex}
        config={step.config}
        onAttempt={onAttempt}
        onComplete={onStepComplete}
      />
      <div className="activity-screen__buddy">
        <Mascot mood={mood} size={88} />
      </div>
    </section>
  );
}
