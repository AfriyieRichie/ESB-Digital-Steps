import { create } from 'zustand';

// Whether the facilitator area is unlocked for this session. Session-only (in
// memory): locking again, or reloading the device, requires the PIN once more.

interface AuthState {
  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

export const useFacilitatorAuth = create<AuthState>((set) => ({
  unlocked: false,
  unlock: () => set({ unlocked: true }),
  lock: () => set({ unlocked: false }),
}));
