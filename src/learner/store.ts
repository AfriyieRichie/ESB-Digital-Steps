import { create } from 'zustand';

// The current learner. No login, no password — a child simply taps their name.
// We hold only the id here; the full record is read from Dexie when needed.

interface CurrentLearnerState {
  currentLearnerId: string | null;
  select: (learnerId: string) => void;
  clear: () => void;
}

export const useCurrentLearner = create<CurrentLearnerState>((set) => ({
  currentLearnerId: null,
  select: (learnerId) => set({ currentLearnerId: learnerId }),
  clear: () => set({ currentLearnerId: null }),
}));
