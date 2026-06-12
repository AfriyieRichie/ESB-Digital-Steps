import { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { useLearners } from './useLearners';
import { createLearner } from './createLearner';
import { LearnerForm } from './LearnerForm';
import { useCurrentLearner } from './store';
import { useAppStore } from '../app/store';
import './LearnerPicker.css';

/** No-login learner selection: tap a name to become the current learner. */
export function LearnerPicker(): React.JSX.Element {
  const [reloadToken, setReloadToken] = useState(0);
  const learners = useLearners(reloadToken);
  const select = useCurrentLearner((s) => s.select);
  const goJourney = useAppStore((s) => s.goJourney);

  const [adding, setAdding] = useState(false);

  function choose(learnerId: string): void {
    select(learnerId);
    goJourney();
  }

  if (adding) {
    return (
      <section className="picker">
        <LearnerForm
          heading="Add a learner"
          submitLabel="Save"
          onSubmit={async (values) => {
            await createLearner(values);
            setAdding(false);
            setReloadToken((t) => t + 1);
          }}
          onCancel={() => setAdding(false)}
        />
      </section>
    );
  }

  return (
    <section className="picker">
      <h1 className="picker__title">Who is learning today?</h1>

      {learners.status === 'loading' && <p className="picker__hint">Loading…</p>}
      {learners.status === 'error' && (
        <p className="picker__error" role="alert">
          Could not load learners: {learners.error.message}
        </p>
      )}

      {learners.status === 'ready' && (
        <ul className="picker__grid">
          {learners.data.map((learner) => (
            <li key={learner.id}>
              <button
                type="button"
                className="picker__card"
                onPointerDown={() => choose(learner.id)}
              >
                <Avatar name={learner.name} avatar={learner.avatar} size="lg" />
                <span className="picker__name">{learner.name}</span>
                <span className="picker__band">Level {learner.band}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="picker__card picker__card--add"
              onPointerDown={() => setAdding(true)}
            >
              <span className="picker__add-mark" aria-hidden="true">＋</span>
              <span className="picker__name">Add learner</span>
            </button>
          </li>
        </ul>
      )}
    </section>
  );
}
