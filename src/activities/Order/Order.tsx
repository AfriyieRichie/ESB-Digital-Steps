import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityProps } from '../engine.types';
import type { OrderConfig } from '../../content/schema';
import { playCorrect, playPop, playWrong } from '../../audio/sounds';
import { speak } from '../../audio/voice';
import { SpeakButton } from '../../ui/SpeakButton';
import './Order.css';

// Order ("build the word"): the child taps scrambled letter tiles in sequence to
// spell the target word — early writing / encoding. Tapping reads the letter
// aloud. The next letter must be tapped correctly to be placed (a wrong tap is a
// gentle, low-stakes miss), so the child always succeeds and learns the order.

interface Tile {
  id: number;
  letter: string;
}

function scramble(word: string): Tile[] {
  const tiles: Tile[] = word.split('').map((letter, id) => ({ id, letter }));
  for (let i = tiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j]!, tiles[i]!];
  }
  return tiles;
}

type Status = 'idle' | 'wrong' | 'right';

export default function Order({
  config,
  onAttempt,
  onComplete,
}: ActivityProps<OrderConfig>): React.JSX.Element {
  const [itemIndex, setItemIndex] = useState(0);
  const [built, setBuilt] = useState('');
  const [used, setUsed] = useState<ReadonlySet<number>>(() => new Set());
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const wordStart = useRef<number>(Date.now());

  const item = config.items[itemIndex];
  const answer = item?.answer ?? '';
  const isLastItem = itemIndex === config.items.length - 1;

  const tiles = useMemo(() => scramble(answer), [answer]);

  const spokenPrompt = item ? `${item.prompt} ${answer}` : '';
  useEffect(() => {
    if (spokenPrompt) speak(spokenPrompt);
  }, [spokenPrompt]);

  function handleTile(tile: Tile): void {
    if (!item || status === 'right' || used.has(tile.id)) return;

    const requiredChar = answer[built.length];
    if (requiredChar !== undefined && tile.letter.toLowerCase() === requiredChar.toLowerCase()) {
      // Correct next letter.
      playPop();
      speak(tile.letter);
      const nextBuilt = built + requiredChar;
      const nextUsed = new Set(used);
      nextUsed.add(tile.id);
      setBuilt(nextBuilt);
      setUsed(nextUsed);

      if (nextBuilt.length === answer.length) {
        onAttempt?.({
          correct: true,
          ms: Date.now() - wordStart.current,
          itemId: item.id,
          ...(item.skill !== undefined ? { skills: [item.skill] } : {}),
        });
        setStatus('right');
        playCorrect();
        window.setTimeout(() => {
          if (isLastItem) {
            onComplete();
          } else {
            setItemIndex((i) => i + 1);
            setBuilt('');
            setUsed(new Set());
            setStatus('idle');
            wordStart.current = Date.now();
          }
        }, 750);
      }
      return;
    }

    // Wrong letter for this position — a gentle miss.
    onAttempt?.({
      correct: false,
      ms: Date.now() - wordStart.current,
      itemId: item.id,
      ...(item.skill !== undefined ? { skills: [item.skill] } : {}),
    });
    setWrongTile(tile.id);
    setStatus('wrong');
    playWrong();
    window.setTimeout(() => setWrongTile(null), 450);
  }

  if (!item) {
    return <p>Nothing to build.</p>;
  }

  return (
    <div className="order">
      <div className="order__prompt-row">
        <p className="order__prompt">{item.prompt}</p>
        <SpeakButton text={spokenPrompt} />
      </div>

      {/* Reference word + the slots being filled in. */}
      <div className="order__slots" aria-label={`Build the word ${answer}`}>
        {answer.split('').map((char, i) => (
          <span
            key={i}
            className={`order__slot${i < built.length ? ' order__slot--filled' : ''}`}
            aria-hidden="true"
          >
            {i < built.length ? built[i]!.toUpperCase() : char.toUpperCase()}
          </span>
        ))}
      </div>

      <div className="order__tiles" role="group" aria-label="Letter tiles">
        {tiles.map((tile) => {
          const isUsed = used.has(tile.id);
          const isWrong = wrongTile === tile.id;
          return (
            <button
              key={tile.id}
              type="button"
              className={`order__tile${isUsed ? ' order__tile--used' : ''}${
                isWrong ? ' order__tile--wrong' : ''
              }`}
              onPointerDown={() => handleTile(tile)}
              disabled={isUsed || status === 'right'}
              aria-label={tile.letter}
            >
              {tile.letter.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
