import { useEffect } from 'react';
import { Button } from '../ui/Button';
import { Guide } from './Guide';
import { useAppStore } from '../app/store';
import { playReward } from '../audio/sounds';
import { useT } from '../i18n/store';
import './RewardScreen.css';

/** Celebratory screen shown after an activity completes. */
export function RewardScreen(): React.JSX.Element {
  const goJourney = useAppStore((s) => s.goJourney);
  const goVillage = useAppStore((s) => s.goVillage);
  const reward = useAppStore((s) => s.lastReward);
  const t = useT();

  // Play the reward fanfare once when the screen appears.
  useEffect(() => {
    playReward();
  }, []);

  const newlyMastered = reward?.newlyMastered ?? 0;
  const message =
    newlyMastered > 0
      ? `You mastered ${newlyMastered} new skill${newlyMastered === 1 ? '' : 's'}!`
      : 'Great practice — keep going!';

  return (
    <section className="reward">
      <div className="reward__confetti" aria-hidden="true">
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} className="reward__confetti-piece" />
        ))}
      </div>
      <div className="reward__star" aria-hidden="true">
        ★
      </div>
      <h1 className="reward__title">{t('reward.title')}</h1>
      <Guide message={message} mood="cheer" />

      {reward && (
        <>
          <dl className="reward__stats">
            <div className="reward__stat">
              <dt>Stars</dt>
              <dd>+{reward.starsEarned} ⭐</dd>
            </div>
            <div className="reward__stat">
              <dt>XP</dt>
              <dd>+{reward.xpEarned}</dd>
            </div>
            <div className="reward__stat">
              <dt>Streak</dt>
              <dd>
                {reward.streakDays} day{reward.streakDays === 1 ? '' : 's'} 🔥
              </dd>
            </div>
          </dl>

          {reward.newBadges.length > 0 && (
            <div className="reward__badges" role="status">
              <p className="reward__badges-title">New badge{reward.newBadges.length === 1 ? '' : 's'}!</p>
              <ul className="reward__badge-list">
                {reward.newBadges.map((badge) => (
                  <li key={badge.id} className="reward__badge">
                    <span className="reward__badge-emoji" aria-hidden="true">
                      {badge.emoji}
                    </span>
                    <span className="reward__badge-label">{badge.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="reward__actions">
        <Button onPointerDown={goVillage}>{t('reward.visitVillage')}</Button>
        <Button variant="ghost" onPointerDown={goJourney}>
          {t('reward.backToJourney')}
        </Button>
      </div>
    </section>
  );
}
