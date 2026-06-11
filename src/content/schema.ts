import { z } from 'zod';
import { SUBJECT_IDS } from '../data/subjects';
import { isCompetencyId } from '../data/competencies';

// Every lesson is validated against this schema at load time. A malformed lesson
// must throw a clear error here — never render a blank screen. As new activity
// types arrive, add them to ACTIVITY_TYPES and give them a config schema in the
// discriminated union below.

export const ACTIVITY_TYPES = ['tap'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

const bandSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const competencyIdSchema = z.string().refine(isCompetencyId, {
  message: 'references a competency id that is not in the framework',
});

// Per-activity config schemas. Discriminated on activityType so each activity
// receives a precisely-typed config and a bad config fails validation loudly.
const tapConfigSchema = z
  .object({
    count: z.number().int().positive(),
  })
  .strict();

export const lessonSchema = z
  .object({
    id: z.string().min(1),
    subject: z.enum(SUBJECT_IDS),
    band: bandSchema,
    title: z.string().min(1),
    blurb: z.string(),
    competencies: z.array(competencyIdSchema).min(1),
    activityType: z.literal('tap'),
    config: tapConfigSchema,
  })
  .strict();

export type Lesson = z.infer<typeof lessonSchema>;
export type TapConfig = z.infer<typeof tapConfigSchema>;

/**
 * Validate raw (untrusted) lesson JSON. Throws a clear, lesson-identifying
 * error if the data does not match the schema.
 */
export function parseLesson(raw: unknown): Lesson {
  const result = lessonSchema.safeParse(raw);
  if (!result.success) {
    const id =
      raw && typeof raw === 'object' && 'id' in raw ? String((raw as { id: unknown }).id) : '<unknown>';
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid lesson "${id}":\n${issues}`);
  }
  return result.data;
}
