import type { HubBackup, ImportResult } from '../backup';

// The sync seam. The app's data lives in IndexedDB on each device; *how* that
// data is shared between the hub's devices is pulled behind this interface so we
// can plug in a real engine later WITHOUT rewriting any features.
//
// A `SyncAdapter` is just a transport to/from some shared place: the local
// network hub, a Kolibri user-state channel, a cloud server, or (for tests) an
// in-memory store. The engine (engine.ts) handles the merge using the same
// idempotent rules as file import, so any adapter is safe to run repeatedly.

/** A device's full syncable snapshot (see data/backup.ts). */
export type HubSnapshot = HubBackup;

export interface SyncAdapter {
  /** Human-readable id, e.g. "kolibri", "lan", "memory". */
  readonly name: string;
  /** Fetch the shared snapshot, or null if the target has none yet. */
  pull(): Promise<HubSnapshot | null>;
  /** Publish this device's snapshot to the shared target. */
  push(snapshot: HubSnapshot): Promise<void>;
}

export interface SyncResult {
  /** What the pull merged in (null if the target had nothing). */
  pulled: ImportResult | null;
  pushed: boolean;
}
