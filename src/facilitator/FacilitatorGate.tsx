import { useEffect, useState } from 'react';
import { clearPin, hasPin, setPin, verifyPin } from './auth';
import { useFacilitatorAuth } from './authStore';
import { PinEntry } from './PinEntry';
import { FacilitatorView } from './FacilitatorView';
import './FacilitatorGate.css';

// Optional PIN protection around the facilitator area. If no PIN is set the area
// is open (with an offer to protect it). If a PIN is set it must be entered once
// per session. Children keep tapping to play regardless — there are no child
// passwords.

type Mode = 'checking' | 'open' | 'locked' | 'setPin';

export function FacilitatorGate(): React.JSX.Element {
  const unlocked = useFacilitatorAuth((s) => s.unlocked);
  const unlock = useFacilitatorAuth((s) => s.unlock);
  const lock = useFacilitatorAuth((s) => s.lock);

  const [mode, setMode] = useState<Mode>('checking');
  const [pinIsSet, setPinIsSet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const exists = await hasPin();
      if (cancelled) return;
      setPinIsSet(exists);
      setMode(!exists || unlocked ? 'open' : 'locked');
    })();
    return () => {
      cancelled = true;
    };
  }, [unlocked]);

  async function handleUnlock(pin: string): Promise<void> {
    if (await verifyPin(pin)) {
      setError(null);
      unlock();
      setMode('open');
    } else {
      setError('That PIN is not right. Try again.');
    }
  }

  async function handleSetPin(pin: string): Promise<void> {
    await setPin(pin);
    setPinIsSet(true);
    unlock();
    setMode('open');
  }

  async function handleRemovePin(): Promise<void> {
    await clearPin();
    setPinIsSet(false);
  }

  if (mode === 'checking') {
    return <p>Loading…</p>;
  }

  if (mode === 'locked') {
    return (
      <PinEntry
        heading="Enter facilitator PIN"
        error={error}
        onSubmit={(pin) => void handleUnlock(pin)}
      />
    );
  }

  if (mode === 'setPin') {
    return (
      <PinEntry
        heading="Set a facilitator PIN (4–6 digits)"
        onSubmit={(pin) => void handleSetPin(pin)}
        onCancel={() => setMode('open')}
      />
    );
  }

  // mode === 'open'
  return (
    <div className="gate">
      <div className="gate__bar">
        {pinIsSet ? (
          <>
            <button
              type="button"
              className="gate__btn"
              onPointerDown={() => {
                lock();
                setMode('locked');
              }}
            >
              🔒 Lock
            </button>
            <button type="button" className="gate__btn" onPointerDown={() => setMode('setPin')}>
              Change PIN
            </button>
            <button type="button" className="gate__btn" onPointerDown={() => void handleRemovePin()}>
              Remove PIN
            </button>
          </>
        ) : (
          <button type="button" className="gate__btn" onPointerDown={() => setMode('setPin')}>
            🔒 Protect with a PIN
          </button>
        )}
      </div>
      <FacilitatorView />
    </div>
  );
}
