import { Button } from '../../ui/Button';
import { Mascot } from '../../ui/Mascot';
import { SUBJECTS, type SubjectId } from '../../data/subjects';
import { useAppStore } from '../store';
import { useT } from '../../i18n/store';
import './StartScreen.css';

// A short, playful emoji per subject — purely decorative, to hint at the breadth
// of the curriculum on the welcome screen.
const SUBJECT_EMOJI: Record<SubjectId, string> = {
  reading: '📖',
  writing: '✏️',
  numeracy: '🔢',
  science: '🔬',
  digital: '💻',
  logic: '🧩',
  social: '🌍',
  sel: '💛',
  arts: '🎨',
};

/** The welcome screen: a game-home hero. Two clear doors: play, or facilitator. */
export function StartScreen(): React.JSX.Element {
  const goLearners = useAppStore((s) => s.goLearners);
  const goFacilitator = useAppStore((s) => s.goFacilitator);
  const t = useT();

  return (
    <section className="start">
      <div className="start__card">
        <div className="start__mascot">
          <Mascot mood="cheer" size={150} />
        </div>

        <h1 className="start__title">{t('app.title')}</h1>
        <p className="start__tagline">{t('start.greeting')}</p>

        <ul className="start__subjects" aria-label="What you can learn">
          {SUBJECTS.map((s) => (
            <li key={s.id} className="start__subject" data-tone={s.tone} title={s.label}>
              <span aria-hidden="true">{SUBJECT_EMOJI[s.id]}</span>
              <span className="start__subject-label">{s.label}</span>
            </li>
          ))}
        </ul>

        <div className="start__actions">
          <Button onPointerDown={goLearners}>▶ {t('start.play')}</Button>
          <Button variant="ghost" onPointerDown={goFacilitator}>
            {t('start.facilitator')}
          </Button>
        </div>
      </div>
    </section>
  );
}
