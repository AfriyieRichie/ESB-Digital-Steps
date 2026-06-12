import { useEffect, useRef, useState } from 'react';
import type { ActivityProps } from '../engine.types';
import type { ReadConfig } from '../../content/schema';
import { playCorrect, playWrong } from '../../audio/sounds';
import { speak } from '../../audio/voice';
import { SpeakButton } from '../../ui/SpeakButton';
import './Read.css';

// Read activity: a passage is shown (and can be read aloud), then the child
// answers comprehension questions about it — main idea, inference, author's
// purpose, evaluating arguments. The passage stays visible while answering so
// the child can re-read; the passage and each question are voiced for emerging
// readers. Wrong answers are low-stakes (try again).

type Status = 'idle' | 'wrong' | 'right';

export default function Read({
  config,
  onAttempt,
  onComplete,
}: ActivityProps<ReadConfig>): React.JSX.Element {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [chosen, setChosen] = useState<number | null>(null);
  const attemptStart = useRef<number>(Date.now());

  const question = config.questions[questionIndex];
  const isLast = questionIndex === config.questions.length - 1;

  // Read the passage aloud once when the activity opens.
  useEffect(() => {
    speak(config.passage);
  }, [config.passage]);

  // Read each new question aloud.
  const prompt = question?.prompt;
  useEffect(() => {
    if (prompt) speak(prompt);
  }, [prompt]);

  function handleChoice(choiceIndex: number): void {
    if (!question || status === 'right') return;

    const correct = choiceIndex === question.answerIndex;
    const now = Date.now();
    onAttempt?.({
      correct,
      ms: now - attemptStart.current,
      itemId: question.id,
      ...(question.skill !== undefined ? { skills: [question.skill] } : {}),
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
      if (isLast) {
        onComplete();
      } else {
        setQuestionIndex((i) => i + 1);
        setStatus('idle');
        setChosen(null);
        attemptStart.current = Date.now();
      }
    }, 700);
  }

  if (!question) {
    return <p>Nothing to read.</p>;
  }

  const feedback =
    status === 'right' ? 'Yes! Well read.' : status === 'wrong' ? 'Look again — try another.' : ' ';

  return (
    <div className="read">
      <article className="read__passage">
        {config.title && <h2 className="read__title">{config.title}</h2>}
        <div className="read__passage-head">
          <span className="read__passage-label">Read this</span>
          <SpeakButton text={config.passage} label="Read the passage aloud" />
        </div>
        <p className="read__text">{config.passage}</p>
      </article>

      <div className="read__q">
        <div className="read__prompt-row">
          <p className="read__prompt">
            <span className="read__q-count">
              Q{questionIndex + 1}/{config.questions.length}
            </span>
            {question.prompt}
          </p>
          <SpeakButton text={question.prompt} />
        </div>

        <div className="read__choices" role="group" aria-label={question.prompt}>
          {question.choices.map((choice, choiceIndex) => {
            const isChosen = chosen === choiceIndex;
            const stateClass =
              isChosen && status === 'right'
                ? ' read__choice--right'
                : isChosen && status === 'wrong'
                  ? ' read__choice--wrong'
                  : '';
            return (
              <button
                key={choiceIndex}
                type="button"
                className={`read__choice${stateClass}`}
                onPointerDown={() => handleChoice(choiceIndex)}
                disabled={status === 'right'}
              >
                {choice}
              </button>
            );
          })}
        </div>

        <p className={`read__feedback read__feedback--${status}`} role="status">
          {feedback}
        </p>
      </div>
    </div>
  );
}
