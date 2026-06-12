import { useRef, useState } from 'react';
import type { ActivityProps } from '../engine.types';
import type { DragConfig } from '../../content/schema';
import { playCorrect, playWrong } from '../../audio/sounds';
import './Drag.css';

// Drag activity: drag the token onto the correct labelled target. Pointer Events
// (with pointer capture) make touch, mouse, and pen behave identically. Dropping
// outside any target is a no-op (the token snaps home) so accidental releases
// don't penalise the child; dropping on a target is recorded as an attempt.

type Status = 'idle' | 'wrong' | 'right';

export default function Drag({
  config,
  onAttempt,
  onComplete,
}: ActivityProps<DragConfig>): React.JSX.Element {
  const [itemIndex, setItemIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);
  const [hoverTarget, setHoverTarget] = useState<number | null>(null);

  const targetRefs = useRef<(HTMLElement | null)[]>([]);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const attemptStart = useRef<number>(Date.now());

  const item = config.items[itemIndex];
  const isLastItem = itemIndex === config.items.length - 1;

  function targetAtPoint(clientX: number, clientY: number): number | null {
    for (let i = 0; i < targetRefs.current.length; i += 1) {
      const el = targetRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return i;
      }
    }
    return null;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>): void {
    if (status === 'right') return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY };
    setOffset({ x: 0, y: 0 });
    setStatus('idle');
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>): void {
    if (!dragStart.current) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    setHoverTarget(targetAtPoint(e.clientX, e.clientY));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>): void {
    if (!dragStart.current || !item) return;
    dragStart.current = null;
    const dropped = targetAtPoint(e.clientX, e.clientY);
    setOffset(null); // snap home
    setHoverTarget(null);

    if (dropped === null) return; // released outside any target — no penalty

    const correct = dropped === item.answerIndex;
    const now = Date.now();
    onAttempt?.({
      correct,
      ms: now - attemptStart.current,
      itemId: item.id,
      ...(item.skill !== undefined ? { skills: [item.skill] } : {}),
    });
    attemptStart.current = now;

    if (!correct) {
      setStatus('wrong');
      playWrong();
      return;
    }

    setStatus('right');
    playCorrect();
    window.setTimeout(() => {
      if (isLastItem) {
        onComplete();
      } else {
        setItemIndex((i) => i + 1);
        setStatus('idle');
        attemptStart.current = Date.now();
      }
    }, 650);
  }

  if (!item) {
    return <p>Nothing to drag.</p>;
  }

  const feedback =
    status === 'right' ? 'Yes! Well done.' : status === 'wrong' ? 'Try another spot.' : ' ';

  return (
    <div className="drag">
      <div className="drag__header">
        <p className="drag__progress" aria-live="polite">
          {itemIndex + 1} of {config.items.length}
        </p>
      </div>

      <p className="drag__prompt">{item.prompt}</p>

      <div className="drag__stage">
        <button
          type="button"
          className={`drag__token${offset ? ' drag__token--dragging' : ''}`}
          style={offset ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          disabled={status === 'right'}
          aria-label="Drag me"
        >
          {item.token}
        </button>

        <div className="drag__targets">
          {item.targets.map((target, i) => (
            <div
              key={i}
              ref={(el) => {
                targetRefs.current[i] = el;
              }}
              className={`drag__target${hoverTarget === i ? ' drag__target--hover' : ''}${
                status === 'right' && i === item.answerIndex ? ' drag__target--right' : ''
              }`}
            >
              {target}
            </div>
          ))}
        </div>
      </div>

      <p className={`drag__feedback drag__feedback--${status}`} role="status">
        {feedback}
      </p>
    </div>
  );
}
