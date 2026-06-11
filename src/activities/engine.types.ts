import type { ComponentType } from 'react';
import type { ActivityType } from '../content/schema';

// The Activity contract. Every activity type is a React component that receives
// its already-validated config and a single onComplete() callback. The activity
// knows nothing about learners, competencies, or persistence — the screen
// wrapper (ActivityScreen) handles recording competencies and showing the
// reward when onComplete fires. Adding a new activity type therefore means:
//   1. add its config schema to content/schema.ts,
//   2. implement a component with these props,
//   3. register it in activities/registry.ts.
// No plumbing changes anywhere else.

export interface ActivityProps<Config> {
  config: Config;
  /** Call exactly once when the child has finished the activity successfully. */
  onComplete: () => void;
}

export type ActivityComponent<Config> = ComponentType<ActivityProps<Config>>;

/** Maps each activity type to the React component that implements it. */
export type ActivityRegistry = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each entry is
  // exact; the registry is heterogeneous so the value type is widened here only.
  [K in ActivityType]: ActivityComponent<any>;
};
