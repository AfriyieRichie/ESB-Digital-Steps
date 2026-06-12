import { BLOOM_LEVELS, type BloomLevel } from '../content/schema';

// The difficulty ladder. Rather than one number, difficulty scales along several
// axes as a child progresses (see docs/CONTENT-ARCHITECTURE §"How difficulty
// scales"). The spine is Bloom's cognitive level; `difficulty` (1–5) is the
// within-band fine-grain. These pure helpers let the sequencing engine order and
// compare items consistently.

export type { BloomLevel };
export { BLOOM_LEVELS };

const BLOOM_RANK: Record<BloomLevel, number> = {
  recall: 0,
  apply: 1,
  analyze: 2,
  create: 3,
};

export function bloomRank(level: BloomLevel): number {
  return BLOOM_RANK[level];
}

/** The cognitive level a band is expected to reach by default (recall -> create). */
export function defaultBloomForBand(band: number): BloomLevel {
  if (band <= 1) return 'recall';
  if (band <= 3) return 'apply';
  if (band <= 4) return 'analyze';
  return 'create';
}

/**
 * A single comparable difficulty score from the available axes, for ordering
 * items within a lesson/skill. Bloom dominates; `difficulty` (1–5) breaks ties.
 */
export function difficultyScore(opts: { bloom?: BloomLevel; difficulty?: number }): number {
  const bloom = opts.bloom ? bloomRank(opts.bloom) : 0;
  const fine = opts.difficulty ?? 1;
  return bloom * 10 + fine;
}
