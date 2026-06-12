import type { ActivityRegistry } from './engine.types';
import Tap from './Tap/Tap';
import Choose from './Choose/Choose';
import Type from './Type/Type';
import Drag from './Drag/Drag';
import Match from './Match/Match';
import Order from './Order/Order';
import Read from './Read/Read';

// Maps each lesson's activityType to the component that renders it. Adding an
// activity type is just a new folder + an entry here — nothing else in the
// screen-routing code changes.
export const ACTIVITY_REGISTRY: ActivityRegistry = {
  tap: Tap,
  choose: Choose,
  type: Type,
  drag: Drag,
  match: Match,
  order: Order,
  read: Read,
};
