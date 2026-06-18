import type { SubjectId } from './subjects';

// Strands are the topics within a subject — the layer between Subject and Skill
// (see docs/CONTENT-ARCHITECTURE.md). This taxonomy spans all tracks across the
// five bands; competencies and lessons are authored onto it. Only some strands
// have concrete competencies/content yet; the rest are the framework's skeleton,
// ready to fill.

export interface Strand {
  id: string;
  subject: SubjectId;
  label: string;
}

export const STRANDS: readonly Strand[] = [
  // Reading (literacy)
  { id: 'r_print', subject: 'reading', label: 'Letters & print' },
  { id: 'r_comp', subject: 'reading', label: 'Comprehension' },
  { id: 'r_vocab', subject: 'reading', label: 'Vocabulary' },
  // Writing (literacy)
  { id: 'w_build', subject: 'writing', label: 'Building words' },
  { id: 'w_compose', subject: 'writing', label: 'Composing' },
  // Numeracy / mathematics
  { id: 'n_number', subject: 'numeracy', label: 'Numbers & counting' },
  { id: 'n_ops', subject: 'numeracy', label: 'Operations' },
  { id: 'n_geometry', subject: 'numeracy', label: 'Shapes & measurement' },
  { id: 'n_data', subject: 'numeracy', label: 'Data & chance' },
  // Science
  { id: 'sci_observe', subject: 'science', label: 'Observation & classification' },
  { id: 'sci_inquiry', subject: 'science', label: 'Experiments & inquiry' },
  // Digital literacy & computing
  { id: 'd_use', subject: 'digital', label: 'Using the device' },
  { id: 'd_care', subject: 'digital', label: 'Care & responsibility' },
  { id: 'd_code', subject: 'digital', label: 'Coding & computing' },
  { id: 'd_safety', subject: 'digital', label: 'Online safety' },
  // Logic & problem solving
  { id: 'l_pattern', subject: 'logic', label: 'Patterns & sequences' },
  { id: 'l_reason', subject: 'logic', label: 'Reasoning & puzzles' },
  // Social studies / world knowledge
  { id: 'soc_community', subject: 'social', label: 'Family & community' },
  { id: 'soc_world', subject: 'social', label: 'Maps & world' },
  { id: 'soc_history', subject: 'social', label: 'History & timelines' },
  { id: 'soc_civics', subject: 'social', label: 'Government & economy' },
  // Social-emotional learning
  { id: 'sel_emotion', subject: 'sel', label: 'Emotions' },
  { id: 'sel_social', subject: 'sel', label: 'Empathy & collaboration' },
  { id: 'sel_regulate', subject: 'sel', label: 'Self-regulation & goals' },
  // Creative arts
  { id: 'art_make', subject: 'arts', label: 'Drawing & making' },
  { id: 'art_music', subject: 'arts', label: 'Music' },
];

const STRAND_BY_ID: ReadonlyMap<string, Strand> = new Map(STRANDS.map((s) => [s.id, s]));

export function getStrand(id: string): Strand {
  const strand = STRAND_BY_ID.get(id);
  if (!strand) throw new Error(`Unknown strand: ${id}`);
  return strand;
}

export function isStrandId(id: string): boolean {
  return STRAND_BY_ID.has(id);
}

/** True when the strand exists and belongs to the given subject. */
export function strandBelongsToSubject(strandId: string, subject: SubjectId): boolean {
  const strand = STRAND_BY_ID.get(strandId);
  return strand !== undefined && strand.subject === subject;
}

export function strandsForSubject(subject: SubjectId): readonly Strand[] {
  return STRANDS.filter((s) => s.subject === subject);
}
