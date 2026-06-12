// Pure shaping + serialisation for the funder-facing export. No Dexie, no React,
// so the CSV/JSON output is deterministic and unit-testable. The Dexie collector
// (export.ts) fills the model from on-device data.

export interface LearnerExport {
  learnerId: string;
  name: string;
  band: number;
  /** Mastered competency ids (the funder-facing milestones). */
  mastered: string[];
  masteredCount: number;
  totalCompetencies: number;
  masteryPercent: number;
  attempts: number;
  correct: number;
  accuracyPercent: number | null;
  timeOnTaskSeconds: number;
  streakDays: number;
  stars: number;
  xp: number;
  badges: string[];
}

export interface ExportModel {
  /** ISO timestamp of when the export was produced. */
  exportedAt: string;
  hubName: string;
  /** Competency ids in a stable column order (for the CSV grid). */
  competencyIds: string[];
  learners: LearnerExport[];
}

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const SUMMARY_HEADERS = [
  'Learner ID',
  'Name',
  'Band',
  'Mastered',
  'Total competencies',
  'Mastery %',
  'Attempts',
  'Accuracy %',
  'Time on task (s)',
  'Streak (days)',
  'Stars',
  'XP',
  'Badges',
] as const;

/**
 * Wide CSV: one row per learner, a 1/0 column per competency, then summary
 * metrics. Funder-friendly and openable in any spreadsheet — fully offline.
 */
export function toCsv(model: ExportModel): string {
  const header = [...SUMMARY_HEADERS.slice(0, 3), ...model.competencyIds, ...SUMMARY_HEADERS.slice(3)];

  const rows = model.learners.map((l) => {
    const masteredSet = new Set(l.mastered);
    const competencyCells = model.competencyIds.map((id) => (masteredSet.has(id) ? '1' : '0'));
    const cells = [
      l.learnerId,
      l.name,
      l.band,
      ...competencyCells,
      l.masteredCount,
      l.totalCompetencies,
      l.masteryPercent,
      l.attempts,
      l.accuracyPercent ?? '',
      l.timeOnTaskSeconds,
      l.streakDays,
      l.stars,
      l.xp,
      l.badges.join(' '),
    ];
    return cells.map(csvEscape).join(',');
  });

  return [header.map(csvEscape).join(','), ...rows].join('\n');
}

/** Full structured snapshot, pretty-printed. */
export function toJson(model: ExportModel): string {
  return JSON.stringify(model, null, 2);
}

/** Stable file-name base, e.g. esb-progress-2026-06-12. */
export function exportFilenameBase(exportedAt: string): string {
  const datePart = exportedAt.slice(0, 10);
  return `esb-progress-${datePart}`;
}
