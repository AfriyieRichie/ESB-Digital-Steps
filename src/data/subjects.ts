// The learning tracks the system teaches, scaled across the five developmental
// bands (see docs/CONTENT-ARCHITECTURE). The architecture is subject-agnostic:
// competencies, strands, lessons, and activities all reference a SubjectId, so
// adding real content to any track requires no structural change.

export const SUBJECT_IDS = [
  'reading',
  'writing',
  'numeracy',
  'science',
  'digital',
  'logic',
  'social',
  'sel',
  'arts',
] as const;

export type SubjectId = (typeof SUBJECT_IDS)[number];

export interface Subject {
  id: SubjectId;
  label: string;
  /** Colour token name (see ui/tokens.css). Equals the id. */
  tone: SubjectId;
}

export const SUBJECTS: readonly Subject[] = [
  { id: 'reading', label: 'Reading', tone: 'reading' },
  { id: 'writing', label: 'Writing', tone: 'writing' },
  { id: 'numeracy', label: 'Numeracy', tone: 'numeracy' },
  { id: 'science', label: 'Science', tone: 'science' },
  { id: 'digital', label: 'Digital skills', tone: 'digital' },
  { id: 'logic', label: 'Logic & puzzles', tone: 'logic' },
  { id: 'social', label: 'My world', tone: 'social' },
  { id: 'sel', label: 'Feelings & friends', tone: 'sel' },
  { id: 'arts', label: 'Art & music', tone: 'arts' },
];

const SUBJECT_BY_ID: ReadonlyMap<SubjectId, Subject> = new Map(
  SUBJECTS.map((s) => [s.id, s]),
);

export function getSubject(id: SubjectId): Subject {
  const subject = SUBJECT_BY_ID.get(id);
  if (!subject) throw new Error(`Unknown subject: ${id}`);
  return subject;
}
