import './Guide.css';

// A small, friendly guide character that speaks to the child. Kept deliberately
// minimal (an emoji face + a speech line) — no audio yet; bundled audio arrives
// in a later task via assets/audio.

interface GuideProps {
  message: string;
  mood?: 'happy' | 'cheer';
}

export function Guide({ message, mood = 'happy' }: GuideProps): React.JSX.Element {
  const face = mood === 'cheer' ? '🤩' : '🙂';
  return (
    <div className="guide">
      <span className="guide__face" aria-hidden="true">
        {face}
      </span>
      <p className="guide__bubble">{message}</p>
    </div>
  );
}
