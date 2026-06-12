// Synthesised sound feedback (earcons) via the Web Audio API. No audio files,
// no network — tones are generated on the device, so this works fully offline,
// from file://, and in a Kolibri sandbox. Bundled voice narration can be added
// later (see voice.ts); these earcons give immediate, joyful feedback now, which
// matters most for pre-readers who cannot read the prompts.
//
// Import-safe: nothing here touches the browser at module load. The AudioContext
// is created lazily on first use (browsers require a user gesture anyway).

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- webkit prefix for older Safari/WebViews.
      const Ctor: typeof AudioContext = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    // Resume if a prior gesture left it suspended.
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneSpec {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

function playTones(tones: readonly ToneSpec[]): void {
  if (!enabled) return;
  const audio = getContext();
  if (!audio) return;

  const now = audio.currentTime;
  for (const tone of tones) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = tone.type ?? 'sine';
    osc.frequency.value = tone.freq;

    const startAt = now + tone.start;
    const endAt = startAt + tone.duration;
    const peak = tone.gain ?? 0.2;
    // Short attack/decay envelope to avoid clicks.
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

    osc.connect(gain).connect(audio.destination);
    osc.start(startAt);
    osc.stop(endAt + 0.02);
  }
}

/** A short blip — e.g. a tapped target popping. */
export function playPop(): void {
  playTones([{ freq: 520, start: 0, duration: 0.08, type: 'triangle', gain: 0.18 }]);
}

/** Two rising notes — a correct answer. */
export function playCorrect(): void {
  playTones([
    { freq: 660, start: 0, duration: 0.12 },
    { freq: 880, start: 0.1, duration: 0.16 },
  ]);
}

/** A soft low buzz — a wrong answer (gentle, never harsh). */
export function playWrong(): void {
  playTones([{ freq: 220, start: 0, duration: 0.18, type: 'sawtooth', gain: 0.12 }]);
}

/** A little arpeggio fanfare — a completed activity / reward. */
export function playReward(): void {
  playTones([
    { freq: 523, start: 0, duration: 0.14 },
    { freq: 659, start: 0.12, duration: 0.14 },
    { freq: 784, start: 0.24, duration: 0.14 },
    { freq: 1047, start: 0.36, duration: 0.24 },
  ]);
}
