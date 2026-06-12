import { mergeHubData, snapshotHubData } from '../backup';
import type { SyncAdapter, SyncResult } from './types';

// Two-way sync through any adapter: pull the shared snapshot and merge it into
// this device, then publish this device's (now-merged) snapshot back. Because
// the merge is idempotent and order-independent, running this repeatedly across
// the hub's devices converges them all to the same data — which is exactly the
// local-network sync behaviour we want, with the transport left to the adapter.

export async function runSync(adapter: SyncAdapter): Promise<SyncResult> {
  const incoming = await adapter.pull();
  const pulled = incoming ? await mergeHubData(incoming) : null;

  const snapshot = await snapshotHubData();
  await adapter.push(snapshot);

  return { pulled, pushed: true };
}
