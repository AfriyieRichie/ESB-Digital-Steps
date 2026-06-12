import { isSoundEnabled } from './sounds';

// Spoken narration using the device's built-in speech engine (Web Speech API).
// On-device and offline — no recordings, no network — so prompts can be read
// aloud to children who cannot yet read. It is a progressive enhancement: if the
// device has no speech voice, every call is a graceful no-op.
//
// Recorded voice clips (better quality, and the path to non-English narration)
// can replace this later behind the same speak() call. Import-safe: nothing here
// touches the browser at module load.

// Emoji / pictographs and variation selectors — stripped before speaking so the
// engine reads "Count the apples" rather than naming each emoji.
const NON_SPEECH = /[\p{Extended_Pictographic}‍️]/gu;

/** The speakable text of a prompt: emoji removed, whitespace collapsed. */
export function speakable(text: string): string {
  return text.replace(NON_SPEECH, ' ').replace(/\s+/g, ' ').trim();
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Read text aloud in English. No-ops if sound is muted or speech is unavailable. */
export function speak(text: string): void {
  if (!isSoundEnabled() || !isSpeechSupported()) return;
  const clean = speakable(text);
  if (!clean) return;
  try {
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'en';
    utterance.rate = 0.9; // a little slower for young learners
    utterance.pitch = 1.1;
    window.speechSynthesis.cancel(); // never let prompts overlap
    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech unavailable on this device — silently skip.
  }
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
