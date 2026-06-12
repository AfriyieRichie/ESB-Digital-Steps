import { COMPETENCIES, competenciesForSubject } from '../data/competencies';
import { SUBJECTS, type SubjectId } from '../data/subjects';
import type { SkillStat } from '../data/attempts';

// Pure assembly of a single learner's progress breakdown, so it can be
// unit-tested without Dexie or React. The hook (useLearnerReport) fills these
// from on-device data.

export interface CompetencyLine {
  id: string;
  label: string;
  mastered: boolean;
  /** 0–100 from the attempt log, or null if never attempted. */
  accuracyPercent: number | null;
  attempts: number;
}

export interface SubjectBreakdown {
  subjectId: SubjectId;
  label: string;
  masteredCount: number;
  totalCount: number;
  percent: number;
  competencies: CompetencyLine[];
}

function accuracyOf(stat: SkillStat | undefined): number | null {
  return stat && stat.attempts > 0 ? Math.round(stat.accuracy * 100) : null;
}

/**
 * Per-subject breakdown: for every subject that has competencies, each
 * competency with its mastered flag and accuracy, plus the subject's mastery %.
 */
export function buildSubjectBreakdown(
  mastered: ReadonlySet<string>,
  skillStats: ReadonlyMap<string, SkillStat>,
): SubjectBreakdown[] {
  const breakdowns: SubjectBreakdown[] = [];

  for (const subject of SUBJECTS) {
    const comps = competenciesForSubject(subject.id);
    if (comps.length === 0) continue;

    const competencies: CompetencyLine[] = comps.map((c) => ({
      id: c.id,
      label: c.label,
      mastered: mastered.has(c.id),
      accuracyPercent: accuracyOf(skillStats.get(c.id)),
      attempts: skillStats.get(c.id)?.attempts ?? 0,
    }));
    const masteredCount = competencies.reduce((n, c) => (c.mastered ? n + 1 : n), 0);

    breakdowns.push({
      subjectId: subject.id,
      label: subject.label,
      masteredCount,
      totalCount: comps.length,
      percent: comps.length === 0 ? 0 : Math.round((masteredCount / comps.length) * 100),
      competencies,
    });
  }

  return breakdowns;
}

/** Overall mastery percentage across the whole framework. */
export function overallMasteryPercent(mastered: ReadonlySet<string>): number {
  const total = COMPETENCIES.length;
  if (total === 0) return 0;
  const count = COMPETENCIES.reduce((n, c) => (mastered.has(c.id) ? n + 1 : n), 0);
  return Math.round((count / total) * 100);
}
