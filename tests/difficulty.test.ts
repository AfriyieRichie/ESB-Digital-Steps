import { describe, expect, it } from 'vitest';
import { bloomRank, defaultBloomForBand, difficultyScore } from '../src/data/difficulty';

describe('Bloom difficulty ladder', () => {
  it('ranks Bloom levels recall < apply < analyze < create', () => {
    expect(bloomRank('recall')).toBeLessThan(bloomRank('apply'));
    expect(bloomRank('apply')).toBeLessThan(bloomRank('analyze'));
    expect(bloomRank('analyze')).toBeLessThan(bloomRank('create'));
  });

  it('expects higher cognitive levels in higher bands', () => {
    expect(defaultBloomForBand(1)).toBe('recall');
    expect(defaultBloomForBand(2)).toBe('apply');
    expect(defaultBloomForBand(4)).toBe('analyze');
    expect(defaultBloomForBand(5)).toBe('create');
  });

  it('orders items by Bloom first, then fine-grained difficulty', () => {
    const recallHard = difficultyScore({ bloom: 'recall', difficulty: 5 });
    const applyEasy = difficultyScore({ bloom: 'apply', difficulty: 1 });
    expect(applyEasy).toBeGreaterThan(recallHard);

    const a = difficultyScore({ bloom: 'apply', difficulty: 2 });
    const b = difficultyScore({ bloom: 'apply', difficulty: 4 });
    expect(b).toBeGreaterThan(a);
  });
});
