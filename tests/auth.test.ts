import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/data/db';
import { clearPin, hasPin, hashPin, setPin, verifyPin } from '../src/facilitator/auth';

beforeEach(async () => {
  await db.settings.clear();
});

describe('facilitator PIN', () => {
  it('has no PIN by default', async () => {
    expect(await hasPin()).toBe(false);
    expect(await verifyPin('0000')).toBe(false);
  });

  it('sets a PIN and verifies it (correct vs wrong)', async () => {
    await setPin('2468');
    expect(await hasPin()).toBe(true);
    expect(await verifyPin('2468')).toBe(true);
    expect(await verifyPin('1234')).toBe(false);
  });

  it('never stores the PIN in clear text', async () => {
    await setPin('1357');
    const stored = await db.settings.get('facilitatorPinHash');
    expect(stored?.value).toBeDefined();
    expect(stored?.value).not.toContain('1357');
    expect(stored?.value).toBe(await hashPin('1357'));
  });

  it('clears the PIN', async () => {
    await setPin('1111');
    await clearPin();
    expect(await hasPin()).toBe(false);
  });
});
