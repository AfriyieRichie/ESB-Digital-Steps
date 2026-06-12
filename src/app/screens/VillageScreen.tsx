import { Button } from '../../ui/Button';
import { VILLAGE_PIECES, getVillagePiece } from '../../gamification/village';
import { useVillage } from '../../gamification/useVillage';
import { useCurrentLearner } from '../../learner/store';
import { useAppStore } from '../store';
import './VillageScreen.css';

/**
 * The grow-a-village reward world: spend stars earned by learning on cosmetic
 * pieces and watch the village grow. Fully on-device and offline.
 */
export function VillageScreen(): React.JSX.Element {
  const currentLearnerId = useCurrentLearner((s) => s.currentLearnerId);
  const goJourney = useAppStore((s) => s.goJourney);
  const { status, stars, owned, message, buy } = useVillage(currentLearnerId);

  const ownedPieces = [...owned].map((id) => getVillagePiece(id));

  return (
    <section className="village">
      <div className="village__top">
        <h1 className="village__title">My village</h1>
        <span className="village__stars" aria-label={`${stars} stars`}>
          ⭐ {stars}
        </span>
      </div>

      {/* The village scene */}
      <div className="village__scene" aria-label="Your village">
        {ownedPieces.length === 0 ? (
          <p className="village__empty">Earn stars by learning, then build your village here!</p>
        ) : (
          <ul className="village__pieces">
            {ownedPieces.map((piece) => (
              <li key={piece.id} className="village__piece" title={piece.label}>
                <span aria-hidden="true">{piece.emoji}</span>
                <span className="sr-only">{piece.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* The reward store */}
      <h2 className="village__store-title">Star shop</h2>
      {message && (
        <p className="village__message" role="status">
          {message}
        </p>
      )}
      <ul className="village__store">
        {VILLAGE_PIECES.map((piece) => {
          const isOwned = owned.has(piece.id);
          const affordable = stars >= piece.cost;
          return (
            <li key={piece.id} className="store-card">
              <span className="store-card__emoji" aria-hidden="true">
                {piece.emoji}
              </span>
              <span className="store-card__label">{piece.label}</span>
              {isOwned ? (
                <span className="store-card__owned">✓ In village</span>
              ) : (
                <button
                  type="button"
                  className="store-card__buy"
                  onPointerDown={() => buy(piece.id)}
                  disabled={status !== 'ready' || !affordable}
                >
                  ⭐ {piece.cost}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="village__actions">
        <Button onPointerDown={goJourney}>Back to my journey</Button>
      </div>
    </section>
  );
}
