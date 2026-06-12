import { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import type { Band } from '../data/db';
import type { LearnerProfileInput } from './createLearner';
import { GRADE_OPTIONS, gradeLabel, suggestBandForGrade } from './placement';
import './LearnerForm.css';

const BANDS: readonly Band[] = [1, 2, 3];
const AVATARS = [0, 1, 2, 3];

interface LearnerFormProps {
  heading: string;
  submitLabel: string;
  initial?: Partial<LearnerProfileInput>;
  onSubmit: (values: LearnerProfileInput) => Promise<void>;
  onCancel: () => void;
}

/**
 * Reusable learner profile form (add + edit). Captures first name, optional
 * school / grade / age, level, and avatar. Choosing a grade suggests the level
 * (Teaching at the Right Level); the facilitator can still override it.
 */
export function LearnerForm({
  heading,
  submitLabel,
  initial,
  onSubmit,
  onCancel,
}: LearnerFormProps): React.JSX.Element {
  const [name, setName] = useState(initial?.name ?? '');
  const [school, setSchool] = useState(initial?.school ?? '');
  const [grade, setGrade] = useState<number | undefined>(initial?.grade);
  const [age, setAge] = useState(initial?.age !== undefined ? String(initial.age) : '');
  const [band, setBand] = useState<Band>(initial?.band ?? 1);
  const [avatar, setAvatar] = useState(initial?.avatar ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && !saving;

  function chooseGrade(g: number): void {
    setGrade(g);
    setBand(suggestBandForGrade(g)); // suggest level from grade; still editable
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    setError(null);
    const ageNum = age.trim() === '' ? undefined : Number(age);
    try {
      await onSubmit({
        name,
        band,
        avatar,
        ...(grade !== undefined ? { grade } : {}),
        ...(ageNum !== undefined && Number.isFinite(ageNum) ? { age: ageNum } : {}),
        ...(school.trim() !== '' ? { school } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setSaving(false);
    }
  }

  return (
    <div className="learner-form" role="dialog" aria-label={heading}>
      <h2 className="learner-form__title">{heading}</h2>
      <p className="learner-form__note">Stored on this device only and never sent anywhere.</p>

      <label className="learner-form__field">
        <span className="learner-form__label">First name</span>
        <input
          className="learner-form__input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          autoComplete="off"
          autoFocus
        />
      </label>

      <label className="learner-form__field">
        <span className="learner-form__label">School (optional)</span>
        <input
          className="learner-form__input"
          type="text"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          maxLength={60}
          autoComplete="off"
        />
      </label>

      <div className="learner-form__field">
        <span className="learner-form__label">Grade (optional)</span>
        <div className="learner-form__options">
          {GRADE_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              className={`learner-form__chip${grade === g ? ' learner-form__chip--on' : ''}`}
              onPointerDown={() => chooseGrade(g)}
              aria-pressed={grade === g}
            >
              {gradeLabel(g)}
            </button>
          ))}
        </div>
      </div>

      <label className="learner-form__field learner-form__field--narrow">
        <span className="learner-form__label">Age (optional)</span>
        <input
          className="learner-form__input"
          type="number"
          inputMode="numeric"
          min={2}
          max={18}
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
      </label>

      <div className="learner-form__field">
        <span className="learner-form__label">Level</span>
        <div className="learner-form__options">
          {BANDS.map((b) => (
            <button
              key={b}
              type="button"
              className={`learner-form__chip${band === b ? ' learner-form__chip--on' : ''}`}
              onPointerDown={() => setBand(b)}
              aria-pressed={band === b}
            >
              Level {b}
            </button>
          ))}
        </div>
      </div>

      <div className="learner-form__field">
        <span className="learner-form__label">Avatar colour</span>
        <div className="learner-form__options">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              className={`learner-form__avatar${avatar === a ? ' learner-form__avatar--on' : ''}`}
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
        <p className="learner-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="learner-form__actions">
        <Button onPointerDown={() => void handleSave()} disabled={!canSave}>
          {submitLabel}
        </Button>
        <Button variant="ghost" onPointerDown={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
