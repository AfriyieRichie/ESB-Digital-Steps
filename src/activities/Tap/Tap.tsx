import { useMemo, useRef, useState } from 'react';
import type { ActivityProps } from '../engine.types';
import type { TapConfig } from '../../content/schema';
import { initTapState, isTapComplete, registerTap, tapProgress } from './tapLogic';
import './Tap.css';

interface Target {
  id: number;
  /** Position as a percentage of the play area, kept inside safe margins. */
  xPercent: number;
  yPercent: number;
}

function makeTargets(count: number): Target[] {
  const targets: Target[] = [];
  for (let i = 0; i < count; i += 1) {
    targets.push({
      id: i,
      xPercent: 8 + Math.random() * 84,
      yPercent: 14 + Math.random() * 72,
    });
  }
  return targets;
}

/**
 * Tap activity: N stars appear; the child taps each one. When all are tapped the
 * activity completes. Uses Pointer Events so touch and mouse behave identically.
 */
export default function Tap({ config, onAttempt, onComplete }: ActivityProps<TapConfig>): React.JSX.Element {
  const targets = useMemo(() => makeTargets(config.count), [config.count]);
  const [state, setState] = useState(() => initTapState(config.count));
  const [popped, setPopped] = useState<ReadonlySet<number>>(() => new Set());
  // Timestamp of the previous tap (or mount), to report each tap's reaction time.
  const lastTapAt = useRef<number>(Date.now());

  function handleTap(targetId: number): void {
    if (popped.has(targetId)) return;

    const now = Date.now();
    const ms = now - lastTapAt.current;
    lastTapAt.current = now;
    // Every star tapped is a successful demonstration of the lesson's skills.
    onAttempt?.({ correct: true, ms });

    const nextPopped = new Set(popped);
    nextPopped.add(targetId);
    setPopped(nextPopped);

    const nextState = registerTap(state);
    setState(nextState);

    if (isTapComplete(nextState)) {
      // Let the last star's feedback land before leaving the screen.
      window.setTimeout(onComplete, 350);
    }
  }

  const remaining = state.total - state.tapped;
  const progress = Math.round(tapProgress(state) * 100);

  return (
    <div className="tap">
      <div className="tap__header">
        <p className="tap__instruction">Tap the stars!</p>
        <p className="tap__count" aria-live="polite">
          {remaining} to go
        </p>
      </div>

      <div
        className="tap__field"
        role="group"
        aria-label={`Tap ${config.count} stars. ${remaining} remaining.`}
      >
        {targets.map((target) => {
          const isPopped = popped.has(target.id);
          return (
            <button
              key={target.id}
              type="button"
              className={`tap__star${isPopped ? ' tap__star--popped' : ''}`}
              style={{ left: `${target.xPercent}%`, top: `${target.yPercent}%` }}
              // Pointer Events unify touch + mouse + pen.
              onPointerDown={() => handleTap(target.id)}
              aria-label="Star"
              aria-pressed={isPopped}
              disabled={isPopped}
            >
              <span aria-hidden="true">★</span>
            </button>
          );
        })}
      </div>

      <div
        className="tap__progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Activity progress"
      >
        <div className="tap__progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
