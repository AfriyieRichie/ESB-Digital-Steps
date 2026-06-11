import type { SubjectId } from './subjects';

// The competency framework: every recorded skill maps to one of these ids.
// It is grouped first by subject, then by a human-facing group label. Only the
// digital-literacy competencies are defined in this first slice (the 11 from
// the product spec); reading/writing/numeracy groups are intentionally left
// ready to fill and must keep the same shape.

export interface Competency {
  id: string;
  subject: SubjectId;
  group: string;
  label: string;
}

// --- Digital literacy: the 11 competencies (source of truth) -----------------
const DIGITAL_COMPETENCIES: readonly Competency[] = [
  // Using the device
  { id: 'u_parts', subject: 'digital', group: 'Using the device', label: 'Knows the main parts of the device' },
  { id: 'u_power', subject: 'digital', group: 'Using the device', label: 'Turns the screen on and off' },
  { id: 'u_tap', subject: 'digital', group: 'Using the device', label: 'Taps and selects on screen' },
  { id: 'u_drag', subject: 'digital', group: 'Using the device', label: 'Drags and moves things' },
  { id: 'u_type', subject: 'digital', group: 'Using the device', label: 'Finds letters and types' },
  { id: 'n_open', subject: 'digital', group: 'Using the device', label: 'Opens and closes an activity' },
  // Care & responsibility
  { id: 'c_hold', subject: 'digital', group: 'Care & responsibility', label: 'Holds and carries the device safely' },
  { id: 'c_food', subject: 'digital', group: 'Care & responsibility', label: 'Keeps food and water away' },
  { id: 'c_share', subject: 'digital', group: 'Care & responsibility', label: 'Takes turns and shares' },
  { id: 'c_report', subject: 'digital', group: 'Care & responsibility', label: 'Reports a problem honestly' },
  { id: 'c_return', subject: 'digital', group: 'Care & responsibility', label: 'Returns the device after use' },
];

// Reading / writing / numeracy competencies will be added here as those
// subjects get content. Keeping them as explicit (empty) arrays documents the
// intent and keeps COMPETENCIES below subject-complete.
const READING_COMPETENCIES: readonly Competency[] = [];
const WRITING_COMPETENCIES: readonly Competency[] = [];
const NUMERACY_COMPETENCIES: readonly Competency[] = [];

export const COMPETENCIES: readonly Competency[] = [
  ...READING_COMPETENCIES,
  ...WRITING_COMPETENCIES,
  ...NUMERACY_COMPETENCIES,
  ...DIGITAL_COMPETENCIES,
];

const COMPETENCY_BY_ID: ReadonlyMap<string, Competency> = new Map(
  COMPETENCIES.map((c) => [c.id, c]),
);

export function getCompetency(id: string): Competency {
  const competency = COMPETENCY_BY_ID.get(id);
  if (!competency) throw new Error(`Unknown competency: ${id}`);
  return competency;
}

export function isCompetencyId(id: string): boolean {
  return COMPETENCY_BY_ID.has(id);
}

export function competenciesForSubject(subject: SubjectId): readonly Competency[] {
  return COMPETENCIES.filter((c) => c.subject === subject);
}
