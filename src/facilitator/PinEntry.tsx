import { useState } from 'react';
import { Button } from '../ui/Button';
import { OnScreenKeyboard } from '../ui/OnScreenKeyboard';
import './PinEntry.css';

const MIN_PIN = 4;
const MAX_PIN = 6;

interface PinEntryProps {
  heading: string;
  error?: string | null;
  onSubmit: (pin: string) => void;
  onCancel?: () => void;
}

/** PIN pad using the shared digit keyboard. Submits on Enter (>= 4 digits). */
export function PinEntry({ heading, error, onSubmit, onCancel }: PinEntryProps): React.JSX.Element {
  const [pin, setPin] = useState('');

  function submit(): void {
    if (pin.length >= MIN_PIN) {
      onSubmit(pin);
      setPin('');
    }
  }

  return (
    <div className="pin" role="group" aria-label={heading}>
      <h2 className="pin__heading">{heading}</h2>

      <div className="pin__dots" aria-hidden="true">
        {Array.from({ length: MAX_PIN }).map((_, i) => (
          <span key={i} className={`pin__dot${i < pin.length ? ' pin__dot--on' : ''}`} />
        ))}
      </div>

      {error && (
        <p className="pin__error" role="alert">
          {error}
        </p>
      )}

      <OnScreenKeyboard
        mode="digits"
        onKey={(d) => setPin((p) => (p.length >= MAX_PIN ? p : p + d))}
        onBackspace={() => setPin((p) => p.slice(0, -1))}
        onEnter={submit}
      />

      <div className="pin__actions">
        <Button onPointerDown={submit} disabled={pin.length < MIN_PIN}>
          OK
        </Button>
        {onCancel && (
          <Button variant="ghost" onPointerDown={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
