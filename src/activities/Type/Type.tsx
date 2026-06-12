import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivityProps } from '../engine.types';
import type { TypeConfig } from '../../content/schema';
import { OnScreenKeyboard } from '../../ui/OnScreenKeyboard';
import { isAnswerCorrect, keyboardMode } from './typeLogic';
import { playCorrect, playWrong } from '../../audio/sounds';
import './Type.css';

// Typing activity: the child copies the shown letter/number using the on-screen
// keyboard (a physical keyboard also works). Checking is case/space-forgiving.
// A wrong answer is low-stakes: gentle feedback, clear, try again.

type Status = 'idle' | 'wrong' | 'right';

const MAX_OVERTYPE = 2; // allow a couple of extra chars before blocking input

export default function Type({
  config,
  onAttempt,
  onComplete,
}: ActivityProps<TypeConfig>): React.JSX.Element {
  const [itemIndex, setItemIndex] = useState(0);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const attemptStart = useRef<number>(Date.now());

  const item = config.items[itemIndex];
  const isLastItem = itemIndex === config.items.length - 1;
  const mode = item ? keyboardMode(item.answer) : 'letters';
  const maxLength = item ? item.answer.length + MAX_OVERTYPE : 0;

  const appendChar = useCallback(
    (char: string) => {
      if (status === 'right') return;
      setStatus('idle');
      setInput((prev) => (prev.length >= maxLength ? prev : prev + char));
    },
    [status, maxLength],
  );

  const backspace = useCallback(() => {
    if (status === 'right') return;
    setStatus('idle');
    setInput((prev) => prev.slice(0, -1));
  }, [status]);

  const submit = useCallback(() => {
    if (!item || status === 'right' || input.trim().length === 0) return;

    const correct = isAnswerCorrect(input, item.answer);
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
        setInput('');
        setStatus('idle');
        attemptStart.current = Date.now();
      }
    }, 700);
  }, [item, status, input, isLastItem, onAttempt, onComplete]);

  // Physical keyboard support (desktops/laptops); the on-screen keyboard is the
  // primary path on tablets.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      } else if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
        appendChar(e.key.toUpperCase());
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [appendChar, backspace, submit]);

  if (!item) {
    return <p>Nothing to type.</p>;
  }

  const feedback =
    status === 'right' ? 'Perfect!' : status === 'wrong' ? 'Not quite — try again.' : ' ';

  return (
    <div className="type">
      <div className="type__header">
        <p className="type__progress" aria-live="polite">
          {itemIndex + 1} of {config.items.length}
        </p>
      </div>

      <p className="type__prompt">{item.prompt}</p>

      <div className="type__target" aria-hidden="true">
        {item.answer}
      </div>

      <div
        className={`type__input type__input--${status}`}
        aria-label={`Your answer: ${input || 'empty'}`}
        role="textbox"
        aria-readonly="true"
      >
        {input || ' '}
      </div>

      <p className={`type__feedback type__feedback--${status}`} role="status">
        {feedback}
      </p>

      <OnScreenKeyboard
        mode={mode}
        onKey={appendChar}
        onBackspace={backspace}
        onEnter={submit}
        disabled={status === 'right'}
      />
    </div>
  );
}
