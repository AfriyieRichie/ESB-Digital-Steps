import { SpeakButton } from '../ui/SpeakButton';
import './Guide.css';

// A small, friendly guide character that speaks to the child: an emoji face, a
// speech line, and a tappable speaker that reads the line aloud (on-device
// English voice — see audio/voice.ts).

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
      <SpeakButton text={message} />
    </div>
  );
}
