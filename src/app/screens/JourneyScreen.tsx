import { useCurrentLearner } from '../../learner/store';
import { useLearner } from '../../learner/useLearners';
import { getSubject, SUBJECTS, type SubjectId } from '../../data/subjects';
import { getCompetency } from '../../data/competencies';
import { useAppStore } from '../store';
import { useJourney } from './useJourney';
import type { LessonProgress } from '../../sequencing/progression';
import './JourneyScreen.css';

/**
 * The journey map: the lessons available to a learner at their band (Teaching at
 * the Right Level), grouped into per-subject tracks and ordered. Each lesson is
 * done (mastered), available, or locked until its prerequisite skills are
 * mastered — so the path opens up as the child progresses.
 */
export function JourneyScreen(): React.JSX.Element {
  const currentLearnerId = useCurrentLearner((s) => s.currentLearnerId);
  const learner = useLearner(currentLearnerId);
  const journey = useJourney(currentLearnerId);
  const startActivity = useAppStore((s) => s.startActivity);

  if (!learner || journey.status === 'loading') {
    return <p className="journey__hint">Loading…</p>;
  }

  const { lessons, readyForNextBand } = journey.view;

  // Group the ordered lessons into subject tracks, preserving subject order.
  const tracks = SUBJECTS.map((subject) => ({
    subject: subject.id,
    items: lessons.filter((l) => l.lesson.subject === subject.id),
  })).filter((t) => t.items.length > 0);

  return (
    <section className="journey">
      <h1 className="journey__title">{learner.name}&rsquo;s journey</h1>
      <p className="journey__subtitle">Level {learner.band}</p>

      {readyForNextBand && (
        <p className="journey__ready" role="status">
          🎉 You finished every lesson at Level {learner.band}. You&rsquo;re ready for Level{' '}
          {learner.band + 1}!
        </p>
      )}

      {tracks.length === 0 ? (
        <p className="journey__hint">No lessons here yet — check back soon!</p>
      ) : (
        tracks.map((track) => (
          <JourneyTrack
            key={track.subject}
            subject={track.subject}
            items={track.items}
            onPlay={startActivity}
          />
        ))
      )}
    </section>
  );
}

interface JourneyTrackProps {
  subject: SubjectId;
  items: LessonProgress[];
  onPlay: (lessonId: string) => void;
}

function JourneyTrack({ subject, items, onPlay }: JourneyTrackProps): React.JSX.Element {
  const subjectInfo = getSubject(subject);
  return (
    <div className="track">
      <h2 className="track__label" data-tone={subjectInfo.tone}>
        {subjectInfo.label}
      </h2>
      <ol className="track__list">
        {items.map(({ lesson, state, missingPrereqs }) => {
          const locked = state === 'locked';
          const lockHint =
            missingPrereqs.length > 0
              ? `Finish “${getCompetency(missingPrereqs[0]!).label}” first`
              : 'Locked';
          return (
            <li key={lesson.id} className="track__node">
              <button
                type="button"
                className={`lesson-card lesson-card--${state}`}
                data-tone={subjectInfo.tone}
                onPointerDown={() => !locked && onPlay(lesson.id)}
                disabled={locked}
                aria-label={`${lesson.title}. ${
                  state === 'done' ? 'Completed.' : locked ? lockHint + '.' : 'Ready to play.'
                }`}
              >
                <span className="lesson-card__badge" aria-hidden="true">
                  {state === 'done' ? '✓' : locked ? '🔒' : '▶'}
                </span>
                <span className="lesson-card__title">{lesson.title}</span>
                <span className="lesson-card__blurb">{locked ? lockHint : lesson.blurb}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
