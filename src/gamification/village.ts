// The grow-a-village reward world (content, not stored data). Stars earned by
// learning are spent on these cosmetic-only pieces, which the child places in
// their village. Locally relevant, calm, collectible — and fully offline.

export interface VillagePiece {
  id: string;
  label: string;
  emoji: string;
  /** Cost in stars. */
  cost: number;
}

export const VILLAGE_PIECES: readonly VillagePiece[] = [
  { id: 'tree', label: 'Shea tree', emoji: '🌳', cost: 4 },
  { id: 'flowers', label: 'Flowers', emoji: '🌻', cost: 5 },
  { id: 'hut', label: 'Hut', emoji: '🛖', cost: 8 },
  { id: 'well', label: 'Water well', emoji: '⛲', cost: 9 },
  { id: 'goat', label: 'Goat', emoji: '🐐', cost: 7 },
  { id: 'chicken', label: 'Chicken', emoji: '🐔', cost: 6 },
  { id: 'market', label: 'Market stall', emoji: '🏪', cost: 12 },
  { id: 'drum', label: 'Drum', emoji: '🥁', cost: 10 },
];

const PIECE_BY_ID: ReadonlyMap<string, VillagePiece> = new Map(VILLAGE_PIECES.map((p) => [p.id, p]));

export function getVillagePiece(id: string): VillagePiece {
  const piece = PIECE_BY_ID.get(id);
  if (!piece) throw new Error(`Unknown village piece: ${id}`);
  return piece;
}
