import { AppShell } from './AppShell';
import { Scene } from '../ui/Scene';
import { useAppStore } from './store';
import { StartScreen } from './screens/StartScreen';
import { JourneyScreen } from './screens/JourneyScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { VillageScreen } from './screens/VillageScreen';
import { LearnerPicker } from '../learner/LearnerPicker';
import { RewardScreen } from '../pedagogy/RewardScreen';
import { FacilitatorGate } from '../facilitator/FacilitatorGate';

/** Top-level screen router: a plain switch over the navigation state. */
export function App(): React.JSX.Element {
  const screen = useAppStore((s) => s.screen);

  return (
    <>
      <Scene />
      <AppShell>
        {screen === 'start' && <StartScreen />}
      {screen === 'learners' && <LearnerPicker />}
      {screen === 'journey' && <JourneyScreen />}
      {screen === 'activity' && <ActivityScreen />}
      {screen === 'reward' && <RewardScreen />}
      {screen === 'village' && <VillageScreen />}
      {screen === 'facilitator' && <FacilitatorGate />}
      </AppShell>
    </>
  );
}
