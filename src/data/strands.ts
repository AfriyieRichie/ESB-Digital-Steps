import type { SubjectId } from './subjects';

// Strands are the topics within a subject — the layer between Subject and Skill
// (see docs/CONTENT-ARCHITECTURE.md). They group competencies and organise the
// learning path. Only the digital-literacy strands are concrete in this slice;
// reading/writing/numeracy strands are added as those subjects get content.

export interface Strand {
  id: string;
  subject: SubjectId;
  label: string;
}

export const STRANDS: readonly Strand[] = [
  // Digital literacy
  { id: 'd_use', subject: 'digital', label: 'Using the device' },
  { id: 'd_care', subject: 'digital', label: 'Care & responsibility' },
  // Numeracy
  { id: 'n_number', subject: 'numeracy', label: 'Numbers & counting' },
  // Reading
  { id: 'r_print', subject: 'reading', label: 'Letters & print' },
  // writing strands go here as content is authored.
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
