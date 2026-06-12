import { create } from 'zustand';
import { setSoundEnabled } from './sounds';

// UI preference for sound on/off (not learning data — kept in memory for the
// session). Toggling also updates the sound engine's internal flag so every
// play* call respects it centrally.

interface SoundState {
  enabled: boolean;
  toggle: () => void;
}

export const useSound = create<SoundState>((set, get) => ({
  enabled: true,
  toggle: () => {
    const next = !get().enabled;
    setSoundEnabled(next);
    set({ enabled: next });
  },
}));
