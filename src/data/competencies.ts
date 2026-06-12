import type { SubjectId } from './subjects';

// The competency framework: every recorded skill maps to one of these ids.
// A competency (a.k.a. skill) is the atomic, reportable unit of learning. It
// belongs to a subject and a strand (the topic within that subject). Only the
// digital-literacy competencies are defined in this first slice (the 11 from
// the product spec); reading/writing/numeracy keep the same shape and are added
// as those subjects get content.
//
// `strand` references an id in data/strands.ts. `prerequisites` lists the skill
// ids that should be mastered first (used by the sequencing engine in a later
// slice); it is empty for the foundational skills.

export interface Competency {
  id: string;
  subject: SubjectId;
  strand: string;
  label: string;
  prerequisites: readonly string[];
}

// --- Digital literacy: the 11 competencies (source of truth) -----------------
const DIGITAL_COMPETENCIES: readonly Competency[] = [
  // Strand: Using the device (d_use)
  { id: 'u_parts', subject: 'digital', strand: 'd_use', label: 'Knows the main parts of the device', prerequisites: [] },
  { id: 'u_power', subject: 'digital', strand: 'd_use', label: 'Turns the screen on and off', prerequisites: [] },
  { id: 'u_tap', subject: 'digital', strand: 'd_use', label: 'Taps and selects on screen', prerequisites: [] },
  { id: 'u_drag', subject: 'digital', strand: 'd_use', label: 'Drags and moves things', prerequisites: ['u_tap'] },
  { id: 'u_type', subject: 'digital', strand: 'd_use', label: 'Finds letters and types', prerequisites: ['u_tap'] },
  { id: 'n_open', subject: 'digital', strand: 'd_use', label: 'Opens and closes an activity', prerequisites: ['u_tap'] },
  // Strand: Care & responsibility (d_care)
  { id: 'c_hold', subject: 'digital', strand: 'd_care', label: 'Holds and carries the device safely', prerequisites: [] },
  { id: 'c_food', subject: 'digital', strand: 'd_care', label: 'Keeps food and water away', prerequisites: [] },
  { id: 'c_share', subject: 'digital', strand: 'd_care', label: 'Takes turns and shares', prerequisites: [] },
  { id: 'c_report', subject: 'digital', strand: 'd_care', label: 'Reports a problem honestly', prerequisites: [] },
  { id: 'c_return', subject: 'digital', strand: 'd_care', label: 'Returns the device after use', prerequisites: [] },
];

// First numeracy and reading competencies — enough to anchor the Choose and
// Type activities with real content. These grow as the curriculum is authored.
const READING_COMPETENCIES: readonly Competency[] = [
  { id: 'r_letter', subject: 'reading', strand: 'r_print', label: 'Recognises letters', prerequisites: [] },
  // r_word naturally depends on r_letter. The progression engine only *gates* on
  // prerequisites taught at the learner's own band, so a learner placed at a
  // higher band (assumed to have the foundations) is not locked out — while
  // in-band gating still applies (see m_numeral after m_count).
  { id: 'r_word', subject: 'reading', strand: 'r_print', label: 'Reads simple words', prerequisites: ['r_letter'] },
];
const WRITING_COMPETENCIES: readonly Competency[] = [
  { id: 'w_word', subject: 'writing', strand: 'w_build', label: 'Builds simple words', prerequisites: [] },
];
const NUMERACY_COMPETENCIES: readonly Competency[] = [
  { id: 'm_count', subject: 'numeracy', strand: 'n_number', label: 'Counts objects to 10', prerequisites: [] },
  { id: 'm_numeral', subject: 'numeracy', strand: 'n_number', label: 'Recognises numerals', prerequisites: ['m_count'] },
  { id: 'm_add', subject: 'numeracy', strand: 'n_number', label: 'Adds within 10', prerequisites: ['m_count'] },
];

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

export function competenciesForStrand(strandId: string): readonly Competency[] {
  return COMPETENCIES.filter((c) => c.strand === strandId);
}
