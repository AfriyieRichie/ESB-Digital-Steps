import { create } from 'zustand';
import type { RewardSummary } from '../gamification/progress';

// App/UI navigation state. No router library — screens are a small state
// machine, which keeps the bundle light and works identically from file://.

export type Screen =
  | 'start'
  | 'learners'
  | 'journey'
  | 'activity'
  | 'reward'
  | 'village'
  | 'facilitator';

interface AppState {
  screen: Screen;
  /** Lesson currently being played / just completed. */
  activeLessonId: string | null;
  /** Reward earned by the just-completed activity (for the reward screen). */
  lastReward: RewardSummary | null;

  goStart: () => void;
  goLearners: () => void;
  goJourney: () => void;
  goVillage: () => void;
  goFacilitator: () => void;
  startActivity: (lessonId: string) => void;
  finishActivity: (reward: RewardSummary) => void;
}

export const useAppStore = create<AppState>((set) => ({
  screen: 'start',
  activeLessonId: null,
  lastReward: null,

  goStart: () => set({ screen: 'start', activeLessonId: null }),
  goLearners: () => set({ screen: 'learners', activeLessonId: null }),
  goJourney: () => set({ screen: 'journey', activeLessonId: null }),
  goVillage: () => set({ screen: 'village' }),
  goFacilitator: () => set({ screen: 'facilitator' }),
  startActivity: (lessonId) => set({ screen: 'activity', activeLessonId: lessonId }),
  finishActivity: (reward) => set({ screen: 'reward', lastReward: reward }),
}));
