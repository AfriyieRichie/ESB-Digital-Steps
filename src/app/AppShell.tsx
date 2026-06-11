import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAppStore } from './store';
import { useCurrentLearner } from '../learner/store';
import { useLearner } from '../learner/useLearners';
import './AppShell.css';

// Persistent frame around every screen: a title bar with context-appropriate
// navigation and the current learner's badge. Keeps children oriented and gives
// the facilitator a way back.

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const screen = useAppStore((s) => s.screen);
  const goStart = useAppStore((s) => s.goStart);
  const goJourney = useAppStore((s) => s.goJourney);
  const currentLearnerId = useCurrentLearner((s) => s.currentLearnerId);
  const clearLearner = useCurrentLearner((s) => s.clear);
  const learner = useLearner(currentLearnerId);

  const showHome = screen !== 'start';
  // Inside a learner's flow, "back" returns to their journey; otherwise home.
  const inLearnerFlow = screen === 'activity' || screen === 'reward';

  function handleHome(): void {
    if (screen === 'facilitator') {
      goStart();
    } else {
      clearLearner();
      goStart();
    }
  }

  return (
    <div className="shell">
      <header className="shell__bar">
        <button
          type="button"
          className="shell__brand"
          onPointerDown={handleHome}
          aria-label="Go to start"
        >
          <span className="shell__brand-mark" aria-hidden="true">◆</span>
          ESB Digital Steps
        </button>

        <div className="shell__actions">
          {inLearnerFlow && (
            <Button variant="ghost" onPointerDown={goJourney}>
              Back
            </Button>
          )}
          {showHome && screen !== 'reward' && screen !== 'activity' && (
            <Button variant="ghost" onPointerDown={handleHome}>
              Home
            </Button>
          )}
          {learner && screen !== 'facilitator' && (
            <span className="shell__learner">
              <Avatar name={learner.name} avatar={learner.avatar} />
              <span className="shell__learner-name">{learner.name}</span>
            </span>
          )}
        </div>
      </header>

      <main className="shell__main">{children}</main>
    </div>
  );
}
