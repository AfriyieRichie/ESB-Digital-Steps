import { db } from '../data/db';

// Optional facilitator PIN that protects the dashboard, learner management, and
// export on a shared device. This is light kiosk protection — a gate against
// curious children, not real account security — so there are no child passwords
// and the PIN is short. We still never store it in the clear: only a hash is
// kept, on-device.

const PIN_KEY = 'facilitatorPinHash';

function fallbackHash(text: string): string {
  // Non-crypto hash for environments without WebCrypto (keeps us off plaintext).
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) {
    h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  }
  return `f${(h >>> 0).toString(16)}`;
}

export async function hashPin(pin: string): Promise<string> {
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : undefined;
  if (!subtle) return fallbackHash(pin);
  try {
    const data = new TextEncoder().encode(`esb:${pin}`);
    const digest = await subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return fallbackHash(pin);
  }
}

export async function hasPin(): Promise<boolean> {
  return (await db.settings.get(PIN_KEY)) !== undefined;
}

export async function setPin(pin: string): Promise<void> {
  const value = await hashPin(pin);
  await db.settings.put({ key: PIN_KEY, value });
}

export async function clearPin(): Promise<void> {
  await db.settings.delete(PIN_KEY);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await db.settings.get(PIN_KEY);
  if (!stored) return false;
  return stored.value === (await hashPin(pin));
}
