// The four foundational subjects the system teaches. The architecture is
// subject-agnostic: competencies, lessons, and activities all reference a
// SubjectId, so adding real reading/writing/numeracy content later requires no
// structural change. Only "digital" has concrete content in this first slice.

export const SUBJECT_IDS = ['reading', 'writing', 'numeracy', 'digital'] as const;

export type SubjectId = (typeof SUBJECT_IDS)[number];

export interface Subject {
  id: SubjectId;
  label: string;
  /** Short colour token name (see ui/tokens.css) used to tint the subject. */
  tone: 'reading' | 'writing' | 'numeracy' | 'digital';
}

export const SUBJECTS: readonly Subject[] = [
  { id: 'reading', label: 'Reading', tone: 'reading' },
  { id: 'writing', label: 'Writing', tone: 'writing' },
  { id: 'numeracy', label: 'Numeracy', tone: 'numeracy' },
  { id: 'digital', label: 'Digital skills', tone: 'digital' },
];

const SUBJECT_BY_ID: ReadonlyMap<SubjectId, Subject> = new Map(
  SUBJECTS.map((s) => [s.id, s]),
);

export function getSubject(id: SubjectId): Subject {
  const subject = SUBJECT_BY_ID.get(id);
  if (!subject) throw new Error(`Unknown subject: ${id}`);
  return subject;
}
