import { describe, expect, it } from 'vitest';
import { isAnswerCorrect, keyboardMode, normalizeAnswer } from '../src/activities/Type/typeLogic';

describe('Type answer checking', () => {
  it('is forgiving of case and surrounding whitespace', () => {
    expect(isAnswerCorrect('a', 'A')).toBe(true);
    expect(isAnswerCorrect('  Ama ', 'ama')).toBe(true);
    expect(isAnswerCorrect('CAT', 'cat')).toBe(true);
  });

  it('rejects wrong and empty answers', () => {
    expect(isAnswerCorrect('b', 'A')).toBe(false);
    expect(isAnswerCorrect('', 'A')).toBe(false);
    expect(isAnswerCorrect('   ', 'A')).toBe(false);
  });

  it('normalises consistently', () => {
    expect(normalizeAnswer('  Hello ')).toBe('hello');
  });

  it('chooses a digit keyboard for numeric answers, letters otherwise', () => {
    expect(keyboardMode('7')).toBe('digits');
    expect(keyboardMode('12')).toBe('digits');
    expect(keyboardMode('A')).toBe('letters');
    expect(keyboardMode('cat')).toBe('letters');
  });
});
