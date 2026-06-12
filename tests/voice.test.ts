import { describe, expect, it } from 'vitest';
import { speakable } from '../src/audio/voice';

describe('speakable (prompt text for narration)', () => {
  it('strips emoji and collapses whitespace', () => {
    expect(speakable('Count the apples:  🍎 🍎 🍎')).toBe('Count the apples:');
    expect(speakable('Put the ball in the basket. ⚽')).toBe('Put the ball in the basket.');
  });

  it('leaves plain text untouched', () => {
    expect(speakable('Which one turns the tablet ON?')).toBe('Which one turns the tablet ON?');
  });

  it('returns empty string for emoji-only input', () => {
    expect(speakable('🍎🍎🍎')).toBe('');
  });
});
