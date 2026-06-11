import { Button } from '../ui/Button';
import { Guide } from './Guide';
import { useAppStore } from '../app/store';
import './RewardScreen.css';

/** Celebratory screen shown after an activity completes. */
export function RewardScreen(): React.JSX.Element {
  const goJourney = useAppStore((s) => s.goJourney);
  const newlyRecorded = useAppStore((s) => s.lastNewlyRecorded);

  const message =
    newlyRecorded > 0
      ? `You learned ${newlyRecorded} new skill${newlyRecorded === 1 ? '' : 's'}!`
      : 'Great work — you did it again!';

  return (
    <section className="reward">
      <div className="reward__star" aria-hidden="true">
        ★
      </div>
      <h1 className="reward__title">Well done!</h1>
      <Guide message={message} mood="cheer" />
      <Button onPointerDown={goJourney}>Back to my journey</Button>
    </section>
  );
}
