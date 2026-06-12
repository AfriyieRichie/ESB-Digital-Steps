import { Button } from '../../ui/Button';
import { Guide } from '../../pedagogy/Guide';
import { useAppStore } from '../store';
import { useT } from '../../i18n/store';
import './StartScreen.css';

/** The welcome screen. Two clear doors: start learning, or the facilitator view. */
export function StartScreen(): React.JSX.Element {
  const goLearners = useAppStore((s) => s.goLearners);
  const goFacilitator = useAppStore((s) => s.goFacilitator);
  const t = useT();

  return (
    <section className="start">
      <h1 className="start__title">{t('app.title')}</h1>
      <Guide message={t('start.greeting')} />
      <div className="start__actions">
        <Button onPointerDown={goLearners}>{t('start.play')}</Button>
        <Button variant="ghost" onPointerDown={goFacilitator}>
          {t('start.facilitator')}
        </Button>
      </div>
    </section>
  );
}
