import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityProps } from '../engine.types';
import type { MatchConfig, MatchPair } from '../../content/schema';
import { playCorrect, playWrong } from '../../audio/sounds';
import { speak } from '../../audio/voice';
import './Match.css';

// Match activity: pair each item on the left with its partner on the right by
// tapping one then the other. Tap-to-pair (rather than drawing lines) is the
// most reliable touch interaction. Each correct pairing is a correct attempt for
// that pair's skill; a wrong pairing is a low-stakes incorrect attempt and the
// child simply tries again. Tapping a card reads it aloud.

interface Card {
  pairId: string;
  side: 'L' | 'R';
  text: string;
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function cardKey(card: Card): string {
  return `${card.side}:${card.pairId}`;
}

export default function Match({
  config,
  onAttempt,
  onComplete,
}: ActivityProps<MatchConfig>): React.JSX.Element {
  const pairs = config.pairs;
  const leftCards = useMemo<Card[]>(
    () => pairs.map((p) => ({ pairId: p.id, side: 'L', text: p.left })),
    [pairs],
  );
  const rightCards = useMemo<Card[]>(
    () => shuffle(pairs.map((p) => ({ pairId: p.id, side: 'R', text: p.right }))),
    [pairs],
  );

  const [selected, setSelected] = useState<Card | null>(null);
  const [matched, setMatched] = useState<ReadonlySet<string>>(() => new Set());
  const [wrongKeys, setWrongKeys] = useState<ReadonlySet<string>>(() => new Set());
  const attemptStart = useRef<number>(Date.now());

  useEffect(() => {
    speak('Match the pairs.');
  }, []);

  const pairById = (id: string): MatchPair => {
    const pair = pairs.find((p) => p.id === id);
    if (!pair) throw new Error(`Unknown pair: ${id}`);
    return pair;
  };

  function handleTap(card: Card): void {
    if (matched.has(card.pairId)) return;
    speak(card.text);

    if (!selected) {
      setSelected(card);
      return;
    }
    if (selected.side === card.side) {
      setSelected(card); // switch selection within the same column
      return;
    }

    // Opposite columns: this is a matching attempt.
    const correct = selected.pairId === card.pairId;
    const pair = pairById(selected.pairId);
    const now = Date.now();
    onAttempt?.({
      correct,
      ms: now - attemptStart.current,
      itemId: pair.id,
      ...(pair.skill !== undefined ? { skills: [pair.skill] } : {}),
    });
    attemptStart.current = now;

    if (correct) {
      playCorrect();
      const nextMatched = new Set(matched);
      nextMatched.add(card.pairId);
      setMatched(nextMatched);
      setSelected(null);
      if (nextMatched.size === pairs.length) {
        window.setTimeout(onComplete, 650);
      }
    } else {
      playWrong();
      const flash = new Set([cardKey(selected), cardKey(card)]);
      setWrongKeys(flash);
      setSelected(null);
      window.setTimeout(() => setWrongKeys(new Set()), 500);
    }
  }

  function renderColumn(cards: Card[]): React.JSX.Element {
    return (
      <ul className="match__col">
        {cards.map((card) => {
          const key = cardKey(card);
          const isMatched = matched.has(card.pairId);
          const isSelected = selected !== null && cardKey(selected) === key;
          const isWrong = wrongKeys.has(key);
          const cls = [
            'match__card',
            isMatched ? 'match__card--done' : '',
            isSelected ? 'match__card--selected' : '',
            isWrong ? 'match__card--wrong' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <li key={key}>
              <button
                type="button"
                className={cls}
                onPointerDown={() => handleTap(card)}
                disabled={isMatched}
                aria-pressed={isSelected}
              >
                {isMatched ? <span aria-hidden="true">✓ </span> : null}
                {card.text}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="match">
      <p className="match__instruction">Match the pairs</p>
      <div className="match__columns">
        {renderColumn(leftCards)}
        {renderColumn(rightCards)}
      </div>
    </div>
  );
}
