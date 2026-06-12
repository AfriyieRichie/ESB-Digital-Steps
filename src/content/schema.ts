import { z } from 'zod';
import { SUBJECT_IDS } from '../data/subjects';
import { isCompetencyId } from '../data/competencies';
import { isStrandId, strandBelongsToSubject } from '../data/strands';

// Every lesson is validated against this schema at load time. A malformed lesson
// must throw a clear error here — never render a blank screen.
//
// Content model v2 (see docs/CONTENT-ARCHITECTURE.md):
//   Lesson -> steps[] -> each step is one activity with its config.
//   Item-based activities carry their items inside the step config.
// Adding an activity type = add its step variant to the union below, implement
// the engine.types.ts contract, and register the component. Nothing else changes.

// Activity types that have a registered, playable component. Keep this in sync
// with activities/registry.ts — the registry is typed against it.
export const ACTIVITY_TYPES = ['tap', 'choose', 'type', 'drag', 'match', 'order'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

const bandSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const skillIdSchema = z.string().refine(isCompetencyId, {
  message: 'references a skill id that is not in the competency framework',
});

const strandIdSchema = z.string().refine(isStrandId, {
  message: 'references a strand id that is not in data/strands.ts',
});

// --- Item schemas ------------------------------------------------------------
// Items are the unit of content an activity renders. These are defined now and
// ready for the activities that consume them (Choose, Type — slice #3). Until
// those activities are registered they are not part of any step variant, but
// they are exported and independently validated.

const itemBaseSchema = z.object({
  id: z.string().min(1),
  /** Optional: the specific skill this item exercises (defaults to the lesson). */
  skill: skillIdSchema.optional(),
  /** Optional difficulty within the lesson's band, 1 (easiest) .. 5. */
  difficulty: z.number().int().min(1).max(5).optional(),
});

export const chooseItemSchema = itemBaseSchema
  .extend({
    prompt: z.string().min(1),
    choices: z.array(z.string().min(1)).min(2),
    answerIndex: z.number().int().nonnegative(),
  })
  .strict()
  .refine((item) => item.answerIndex < item.choices.length, {
    message: 'answerIndex is out of range for choices',
    path: ['answerIndex'],
  });

export const typeItemSchema = itemBaseSchema
  .extend({
    prompt: z.string().min(1),
    answer: z.string().min(1),
  })
  .strict();

// Drag: drag the `token` onto the correct one of several labelled targets.
export const dragItemSchema = itemBaseSchema
  .extend({
    prompt: z.string().min(1),
    token: z.string().min(1),
    targets: z.array(z.string().min(1)).min(2),
    answerIndex: z.number().int().nonnegative(),
  })
  .strict()
  .refine((item) => item.answerIndex < item.targets.length, {
    message: 'answerIndex is out of range for targets',
    path: ['answerIndex'],
  });

// Match: pair each left with its right. The pair's id ties the two together.
export const matchPairSchema = itemBaseSchema
  .extend({
    left: z.string().min(1),
    right: z.string().min(1),
  })
  .strict();

// Order (build the word): arrange scrambled letters into `answer` (early
// writing / encoding). `answer` is the target word, e.g. "cat".
export const orderItemSchema = itemBaseSchema
  .extend({
    prompt: z.string().min(1),
    answer: z.string().min(2),
  })
  .strict();

export type ChooseItem = z.infer<typeof chooseItemSchema>;
export type TypeItem = z.infer<typeof typeItemSchema>;
export type DragItem = z.infer<typeof dragItemSchema>;
export type MatchPair = z.infer<typeof matchPairSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;

// --- Step config schemas -----------------------------------------------------
const tapConfigSchema = z
  .object({
    count: z.number().int().positive(),
  })
  .strict();

const chooseConfigSchema = z
  .object({
    items: z.array(chooseItemSchema).min(1),
  })
  .strict();

const typeConfigSchema = z
  .object({
    items: z.array(typeItemSchema).min(1),
  })
  .strict();

const dragConfigSchema = z
  .object({
    items: z.array(dragItemSchema).min(1),
  })
  .strict();

const matchConfigSchema = z
  .object({
    pairs: z.array(matchPairSchema).min(2),
  })
  .strict();

const orderConfigSchema = z
  .object({
    items: z.array(orderItemSchema).min(1),
  })
  .strict();

export type TapConfig = z.infer<typeof tapConfigSchema>;
export type ChooseConfig = z.infer<typeof chooseConfigSchema>;
export type TypeConfig = z.infer<typeof typeConfigSchema>;
export type DragConfig = z.infer<typeof dragConfigSchema>;
export type MatchConfig = z.infer<typeof matchConfigSchema>;
export type OrderConfig = z.infer<typeof orderConfigSchema>;

// A step is one activity instance: its type plus the matching config. Adding a
// variant here is the one-line change that lets content express a new activity.
const stepSchema = z.discriminatedUnion('activityType', [
  z.object({ activityType: z.literal('tap'), config: tapConfigSchema }).strict(),
  z.object({ activityType: z.literal('choose'), config: chooseConfigSchema }).strict(),
  z.object({ activityType: z.literal('type'), config: typeConfigSchema }).strict(),
  z.object({ activityType: z.literal('drag'), config: dragConfigSchema }).strict(),
  z.object({ activityType: z.literal('match'), config: matchConfigSchema }).strict(),
  z.object({ activityType: z.literal('order'), config: orderConfigSchema }).strict(),
]);

export type Step = z.infer<typeof stepSchema>;

// --- Lesson ------------------------------------------------------------------
export const lessonSchema = z
  .object({
    id: z.string().min(1),
    subject: z.enum(SUBJECT_IDS),
    strand: strandIdSchema,
    band: bandSchema,
    title: z.string().min(1),
    blurb: z.string(),
    /** Order within a (subject, band) track on the journey map. Lower first. */
    order: z.number().int().nonnegative().optional(),
    skills: z.array(skillIdSchema).min(1),
    steps: z.array(stepSchema).min(1),
  })
  .strict()
  .refine((lesson) => strandBelongsToSubject(lesson.strand, lesson.subject), {
    message: 'strand does not belong to the lesson subject',
    path: ['strand'],
  });

export type Lesson = z.infer<typeof lessonSchema>;

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
