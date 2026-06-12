import { db, ensureSeedData, type Band, type Learner } from '../data/db';

// Facilitator-run learner management. Profiles are no-login (identity is a tap on
// a name, not an account, and there are no child passwords). Beyond a first name
// we optionally store grade, age, and school to place and group learners — all
// on-device and never transmitted.

export interface LearnerProfileInput {
  name: string;
  band: Band;
  avatar: number;
  grade?: number;
  age?: number;
  school?: string;
}

export interface NewLearnerInput extends LearnerProfileInput {
  hubId?: string;
}

function newLearnerId(): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `learner-${rand}`;
}

/** Optional profile fields, included only when actually provided. */
function profileFields(input: LearnerProfileInput): Partial<Learner> {
  const fields: Partial<Learner> = {};
  if (input.grade !== undefined) fields.grade = input.grade;
  if (input.age !== undefined) fields.age = input.age;
  if (input.school !== undefined && input.school.trim().length > 0) {
    fields.school = input.school.trim();
  }
  return fields;
}

function requireName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new Error('A first name is required.');
  return trimmed;
}

/** Create and persist a new learner. */
export async function createLearner(input: NewLearnerInput): Promise<Learner> {
  const name = requireName(input.name);
  await ensureSeedData();
  const hubId = input.hubId ?? (await db.hubs.toCollection().first())?.id ?? 'hub-1';

  const learner: Learner = {
    id: newLearnerId(),
    name,
    band: input.band,
    avatar: input.avatar,
    hubId,
    createdAt: Date.now(),
    ...profileFields(input),
  };
  await db.learners.add(learner);
  return learner;
}

/** Update an existing learner's profile (name, level, avatar, grade/age/school). */
export async function updateLearner(id: string, input: LearnerProfileInput): Promise<void> {
  const name = requireName(input.name);
  const existing = await db.learners.get(id);
  if (!existing) throw new Error(`Unknown learner: ${id}`);

  // Rebuild the record so cleared optional fields are removed, keeping identity.
  const updated: Learner = {
    id: existing.id,
    hubId: existing.hubId,
    createdAt: existing.createdAt,
    name,
    band: input.band,
    avatar: input.avatar,
    ...profileFields(input),
  };
  await db.learners.put(updated);
}

/**
 * Remove a learner and all of their data (events, attempts, gamification). A
 * clean cascade — no orphaned records, and a real "right to be forgotten".
 */
export async function deleteLearner(id: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.learners, db.competencyEvents, db.attempts, db.learnerProgress, db.awards, db.inventory],
    async () => {
      await db.competencyEvents.where('learnerId').equals(id).delete();
      await db.attempts.where('learnerId').equals(id).delete();
      await db.awards.where('learnerId').equals(id).delete();
      await db.inventory.where('learnerId').equals(id).delete();
      await db.learnerProgress.delete(id);
      await db.learners.delete(id);
    },
  );
}
