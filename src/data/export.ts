// Funder-facing export of the on-device competency record. Stub for now — the
// next task will turn the live Dexie data into a portable file (likely CSV +
// JSON) that a facilitator can carry off the device on a USB stick, without any
// network call. Kept here so the data layer owns export from the start.

export async function exportProgress(): Promise<never> {
  throw new Error('exportProgress is not implemented yet (next task).');
}
