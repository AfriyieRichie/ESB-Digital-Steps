import { describe, expect, it } from 'vitest';
import { suggestBandForGrade } from '../src/learner/placement';

describe('suggestBandForGrade (initial placement)', () => {
  it('places KG–grade 2 at level 1', () => {
    expect(suggestBandForGrade(0)).toBe(1);
    expect(suggestBandForGrade(2)).toBe(1);
  });

  it('places grades 3–4 at level 2', () => {
    expect(suggestBandForGrade(3)).toBe(2);
    expect(suggestBandForGrade(4)).toBe(2);
  });

  it('places grade 5+ at level 3', () => {
    expect(suggestBandForGrade(5)).toBe(3);
    expect(suggestBandForGrade(8)).toBe(3);
  });
});
