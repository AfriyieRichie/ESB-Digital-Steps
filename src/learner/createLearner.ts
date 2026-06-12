import { db, ensureSeedData, type Band, type Learner } from '../data/db';

// Facilitator-run onboarding: create a no-login learner profile. In keeping with
// the child-privacy constraint we store only a first name + learning data
// (level/band, avatar) — no passwords, no contact details, no age. A learner is
// identified by a tap on their name, not by an account.

export interface NewLearnerInput {
  name: string;
  band: Band;
  avatar: number;
  hubId?: string;
}

function newLearnerId(): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `learner-${rand}`;
}

/** Create and persist a new learner. Throws if the name is blank. */
export async function createLearner(input: NewLearnerInput): Promise<Learner> {
  const name = input.name.trim();
  if (name.length === 0) {
    throw new Error('A first name is required to add a learner.');
  }

  await ensureSeedData();
  const hubId = input.hubId ?? (await db.hubs.toCollection().first())?.id ?? 'hub-1';

  const learner: Learner = {
    id: newLearnerId(),
    name,
    band: input.band,
    avatar: input.avatar,
    hubId,
    createdAt: Date.now(),
  };
  await db.learners.add(learner);
  return learner;
}
