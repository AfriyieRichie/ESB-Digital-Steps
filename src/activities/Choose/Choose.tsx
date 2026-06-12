import { useEffect, useRef, useState } from 'react';
import type { ActivityProps } from '../engine.types';
import type { ChooseConfig } from '../../content/schema';
import { playCorrect, playWrong } from '../../audio/sounds';
import { speak } from '../../audio/voice';
import { SpeakButton } from '../../ui/SpeakButton';
import './Choose.css';

// Multiple-choice activity: the child reads a prompt and taps the right answer
// tile. Every answer (right or wrong) is reported as an attempt, so accuracy is
// real; a wrong answer is low-stakes — it gives gentle feedback and lets the
// child try again rather than failing them.

type Status = 'idle' | 'wrong' | 'right';

export default function Choose({
  config,
  onAttempt,
  onComplete,
}: ActivityProps<ChooseConfig>): React.JSX.Element {
  const [itemIndex, setItemIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [chosen, setChosen] = useState<number | null>(null);
  // Start of the current attempt, for reaction time.
  const attemptStart = useRef<number>(Date.now());

  const item = config.items[itemIndex];
  const isLastItem = itemIndex === config.items.length - 1;

  // Read each new prompt aloud for children who cannot read it yet.
  const prompt = item?.prompt;
  useEffect(() => {
    if (prompt) speak(prompt);
  }, [prompt]);

  function handleChoice(choiceIndex: number): void {
    if (!item || status === 'right') return; // locked while the correct answer animates

    const correct = choiceIndex === item.answerIndex;
    const now = Date.now();
    onAttempt?.({
      correct,
      ms: now - attemptStart.current,
      itemId: item.id,
      ...(item.skill !== undefined ? { skills: [item.skill] } : {}),
    });
    attemptStart.current = now;
    setChosen(choiceIndex);

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
        setChosen(null);
        attemptStart.current = Date.now();
      }
    }, 650);
  }

  if (!item) {
    return <p>Nothing to choose.</p>;
  }

  const feedback =
    status === 'right' ? 'Yes! Well done.' : status === 'wrong' ? 'Not quite — try again.' : ' ';

  return (
    <div className="choose">
      <div className="choose__header">
        <p className="choose__progress" aria-live="polite">
          {itemIndex + 1} of {config.items.length}
        </p>
      </div>

      <div className="choose__prompt-row">
        <p className="choose__prompt">{item.prompt}</p>
        <SpeakButton text={item.prompt} />
      </div>

      <div className="choose__grid" role="group" aria-label={item.prompt}>
        {item.choices.map((choice, choiceIndex) => {
          const isChosen = chosen === choiceIndex;
          const stateClass =
            isChosen && status === 'right'
              ? ' choose__option--right'
              : isChosen && status === 'wrong'
                ? ' choose__option--wrong'
                : '';
          return (
            <button
              key={choiceIndex}
              type="button"
              className={`choose__option${stateClass}`}
              onPointerDown={() => handleChoice(choiceIndex)}
              disabled={status === 'right'}
            >
              {choice}
            </button>
          );
        })}
      </div>

      <p className={`choose__feedback choose__feedback--${status}`} role="status">
        {feedback}
      </p>
    </div>
  );
}
