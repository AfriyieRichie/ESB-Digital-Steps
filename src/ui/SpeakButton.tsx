import { speak } from '../audio/voice';
import './SpeakButton.css';

// A small "hear it" speaker the child can tap to have text read aloud again.
// Pairs with auto-speak so a prompt is voiced on arrival and on demand.

interface SpeakButtonProps {
  text: string;
  label?: string;
}

export function SpeakButton({ text, label = 'Hear it again' }: SpeakButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className="speak-btn"
      onPointerDown={() => speak(text)}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">🔈</span>
    </button>
  );
}
