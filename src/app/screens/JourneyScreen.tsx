import { useCurrentLearner } from '../../learner/store';
import { useLearner } from '../../learner/useLearners';
import { lessonsForBand } from '../../content/lessons';
import { getSubject } from '../../data/subjects';
import { useAppStore } from '../store';
import './JourneyScreen.css';

/** The learner's journey: the lessons available at their band (Teaching at the Right Level). */
export function JourneyScreen(): React.JSX.Element {
  const currentLearnerId = useCurrentLearner((s) => s.currentLearnerId);
  const learner = useLearner(currentLearnerId);
  const startActivity = useAppStore((s) => s.startActivity);

  if (!learner) {
    return <p className="journey__hint">Loading…</p>;
  }

  const lessons = lessonsForBand(learner.band);

  return (
    <section className="journey">
      <h1 className="journey__title">{learner.name}&rsquo;s journey</h1>
      <p className="journey__subtitle">Level {learner.band}</p>

      {lessons.length === 0 ? (
        <p className="journey__hint">No lessons here yet — check back soon!</p>
      ) : (
        <ul className="journey__grid">
          {lessons.map((lesson) => {
            const subject = getSubject(lesson.subject);
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  className="journey__card"
                  data-tone={subject.tone}
                  onPointerDown={() => startActivity(lesson.id)}
                >
                  <span className="journey__subject">{subject.label}</span>
                  <span className="journey__lesson-title">{lesson.title}</span>
                  <span className="journey__blurb">{lesson.blurb}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
