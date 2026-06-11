import { Button } from '../../ui/Button';
import { Guide } from '../../pedagogy/Guide';
import { useAppStore } from '../store';
import './StartScreen.css';

/** The welcome screen. Two clear doors: start learning, or the facilitator view. */
export function StartScreen(): React.JSX.Element {
  const goLearners = useAppStore((s) => s.goLearners);
  const goFacilitator = useAppStore((s) => s.goFacilitator);

  return (
    <section className="start">
      <h1 className="start__title">ESB Digital Steps</h1>
      <Guide message="Hello! Ready to learn and play?" />
      <div className="start__actions">
        <Button onPointerDown={goLearners}>Start learning</Button>
        <Button variant="ghost" onPointerDown={goFacilitator}>
          Facilitator
        </Button>
      </div>
    </section>
  );
}
