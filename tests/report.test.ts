import { describe, expect, it } from 'vitest';
import { buildSubjectBreakdown, overallMasteryPercent } from '../src/facilitator/report';
import { COMPETENCIES } from '../src/data/competencies';
import type { SkillStat } from '../src/data/attempts';

function stat(skillId: string, attempts: number, correct: number): SkillStat {
  return {
    skillId,
    attempts,
    correct,
    accuracy: attempts === 0 ? 0 : correct / attempts,
    totalMs: attempts * 500,
    lastAt: 1,
  };
}

describe('per-subject breakdown', () => {
  it('reports mastered competencies and accuracy per subject', () => {
    const mastered = new Set(['u_tap']);
    const skillStats = new Map<string, SkillStat>([['u_tap', stat('u_tap', 5, 4)]]);

    const breakdown = buildSubjectBreakdown(mastered, skillStats);
    const digital = breakdown.find((s) => s.subjectId === 'digital');

    const uTap = digital?.competencies.find((c) => c.id === 'u_tap');
    expect(uTap?.mastered).toBe(true);
    expect(uTap?.accuracyPercent).toBe(80); // 4/5
    expect(uTap?.attempts).toBe(5);

    // A competency never attempted shows null accuracy and not mastered.
    const uPower = digital?.competencies.find((c) => c.id === 'u_power');
    expect(uPower?.mastered).toBe(false);
    expect(uPower?.accuracyPercent).toBeNull();
    expect(digital?.masteredCount).toBe(1);
  });

  it('only includes subjects that have competencies', () => {
    const breakdown = buildSubjectBreakdown(new Set(), new Map());
    for (const subject of breakdown) {
      expect(subject.totalCount).toBeGreaterThan(0);
    }
  });
});

describe('overallMasteryPercent', () => {
  it('is 0 with no mastery and 100 when everything is mastered', () => {
    expect(overallMasteryPercent(new Set())).toBe(0);
    expect(overallMasteryPercent(new Set(COMPETENCIES.map((c) => c.id)))).toBe(100);
  });
});
