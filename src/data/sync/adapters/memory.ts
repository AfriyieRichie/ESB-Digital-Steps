import type { HubSnapshot, SyncAdapter } from '../types';

// An in-memory shared store standing in for a real sync target. Useful for tests
// and as the reference implementation of the SyncAdapter contract — a Kolibri or
// LAN adapter implements the same two methods over its own transport.

export class MemorySyncAdapter implements SyncAdapter {
  readonly name = 'memory';
  private store: HubSnapshot | null = null;

  async pull(): Promise<HubSnapshot | null> {
    return this.store;
  }

  async push(snapshot: HubSnapshot): Promise<void> {
    this.store = snapshot;
  }
}
