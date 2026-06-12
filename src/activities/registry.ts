import type { ActivityRegistry } from './engine.types';
import Tap from './Tap/Tap';
import Choose from './Choose/Choose';
import Type from './Type/Type';

// Maps each lesson's activityType to the component that renders it. The next
// activity types (drag, label, match) register here once built — nothing else
// in the screen-routing code changes.
export const ACTIVITY_REGISTRY: ActivityRegistry = {
  tap: Tap,
  choose: Choose,
  type: Type,
};
