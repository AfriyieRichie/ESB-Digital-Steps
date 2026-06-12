import { Mascot } from '../ui/Mascot';
import { SpeakButton } from '../ui/SpeakButton';
import './Guide.css';

// The friendly guide: the star mascot, a speech line, and a tappable speaker
// that reads the line aloud (on-device voice — see audio/voice.ts).

interface GuideProps {
  message: string;
  mood?: 'happy' | 'cheer';
}

export function Guide({ message, mood = 'happy' }: GuideProps): React.JSX.Element {
  return (
    <div className="guide">
      <Mascot mood={mood} size={84} />
      <p className="guide__bubble">{message}</p>
      <SpeakButton text={message} />
    </div>
  );
}
