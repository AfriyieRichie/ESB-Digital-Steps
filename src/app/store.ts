import { create } from 'zustand';

// App/UI navigation state. No router library — screens are a small state
// machine, which keeps the bundle light and works identically from file://.

export type Screen =
  | 'start'
  | 'learners'
  | 'journey'
  | 'activity'
  | 'reward'
  | 'facilitator';

interface AppState {
  screen: Screen;
  /** Lesson currently being played / just completed. */
  activeLessonId: string | null;
  /** Competencies newly recorded by the just-completed activity (for the reward copy). */
  lastNewlyRecorded: number;

  goStart: () => void;
  goLearners: () => void;
  goJourney: () => void;
  goFacilitator: () => void;
  startActivity: (lessonId: string) => void;
  finishActivity: (newlyRecorded: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  screen: 'start',
  activeLessonId: null,
  lastNewlyRecorded: 0,

  goStart: () => set({ screen: 'start', activeLessonId: null }),
  goLearners: () => set({ screen: 'learners', activeLessonId: null }),
  goJourney: () => set({ screen: 'journey', activeLessonId: null }),
  goFacilitator: () => set({ screen: 'facilitator' }),
  startActivity: (lessonId) => set({ screen: 'activity', activeLessonId: lessonId }),
  finishActivity: (newlyRecorded) => set({ screen: 'reward', lastNewlyRecorded: newlyRecorded }),
}));
