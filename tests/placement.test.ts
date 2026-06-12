import { describe, expect, it } from 'vitest';
import { suggestBandForGrade } from '../src/learner/placement';

describe('suggestBandForGrade (initial placement, 5 bands)', () => {
  it('places KG–grade 1 at band 1 (early childhood)', () => {
    expect(suggestBandForGrade(0)).toBe(1);
    expect(suggestBandForGrade(1)).toBe(1);
  });

  it('places grades 2–3 at band 2 (early elementary)', () => {
    expect(suggestBandForGrade(2)).toBe(2);
    expect(suggestBandForGrade(3)).toBe(2);
  });

  it('places grades 4–5 at band 3 (upper elementary)', () => {
    expect(suggestBandForGrade(4)).toBe(3);
    expect(suggestBandForGrade(5)).toBe(3);
  });

  it('places grades 6–8 at band 4 (middle school)', () => {
    expect(suggestBandForGrade(6)).toBe(4);
    expect(suggestBandForGrade(8)).toBe(4);
  });

  it('places grade 9+ at band 5 (early high school)', () => {
    expect(suggestBandForGrade(9)).toBe(5);
    expect(suggestBandForGrade(12)).toBe(5);
  });
});
