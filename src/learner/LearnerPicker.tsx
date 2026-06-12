import { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useLearners } from './useLearners';
import { createLearner } from './createLearner';
import { useCurrentLearner } from './store';
import { useAppStore } from '../app/store';
import type { Band } from '../data/db';
import './LearnerPicker.css';

const BANDS: readonly Band[] = [1, 2, 3];
const AVATARS = [0, 1, 2, 3];

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

      {adding && (
        <AddLearnerForm
          onCancel={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </section>
  );
}

interface AddLearnerFormProps {
  onCancel: () => void;
  onCreated: () => void;
}

/** Facilitator onboarding: first name + level + avatar only (privacy by design). */
function AddLearnerForm({ onCancel, onCreated }: AddLearnerFormProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [band, setBand] = useState<Band>(1);
  const [avatar, setAvatar] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && !saving;

  async function handleSave(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await createLearner({ name, band, avatar });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add learner.');
      setSaving(false);
    }
  }

  return (
    <div className="add-learner" role="dialog" aria-label="Add a learner">
      <h2 className="add-learner__title">Add a learner</h2>
      <p className="add-learner__note">We only store a first name and learning progress.</p>

      <label className="add-learner__field">
        <span className="add-learner__label">First name</span>
        <input
          className="add-learner__input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          autoComplete="off"
          autoFocus
        />
      </label>

      <div className="add-learner__field">
        <span className="add-learner__label">Level</span>
        <div className="add-learner__options">
          {BANDS.map((b) => (
            <button
              key={b}
              type="button"
              className={`add-learner__chip${band === b ? ' add-learner__chip--on' : ''}`}
              onPointerDown={() => setBand(b)}
              aria-pressed={band === b}
            >
              Level {b}
            </button>
          ))}
        </div>
      </div>

      <div className="add-learner__field">
        <span className="add-learner__label">Avatar colour</span>
        <div className="add-learner__options">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              className={`add-learner__avatar${avatar === a ? ' add-learner__avatar--on' : ''}`}
              onPointerDown={() => setAvatar(a)}
              aria-pressed={avatar === a}
              aria-label={`Avatar colour ${a + 1}`}
            >
              <Avatar name={name || '?'} avatar={a} />
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="add-learner__error" role="alert">
          {error}
        </p>
      )}

      <div className="add-learner__actions">
        <Button onPointerDown={() => void handleSave()} disabled={!canSave}>
          Save
        </Button>
        <Button variant="ghost" onPointerDown={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
