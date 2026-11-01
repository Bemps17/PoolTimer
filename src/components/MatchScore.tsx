import type { MirrorMatch } from '../mirror/protocol';
import { matchWinner } from '../timer/match';
import { displayPlayerName } from '../timer/playerName';
import type { PlayerId } from '../timer/types';

export interface MatchScoreControls {
  onScore: (player: PlayerId, delta: number) => void;
  onFerme: (player: PlayerId, delta: number) => void;
  onToggleBreaker: () => void;
}

interface MatchScoreProps {
  match: MirrorMatch;
  p1Name: string;
  p2Name: string;
  p1Color: string;
  p2Color: string;
  /** Absent = écran Visuel en lecture seule. */
  controls?: MatchScoreControls;
  /** compact = bandeau discret (télécommande, le chrono reste prioritaire). */
  size?: 'compact' | 'full';
  showNames?: boolean;
}

export function MatchScore({
  match,
  p1Name,
  p2Name,
  p1Color,
  p2Color,
  controls,
  size = 'full',
  showNames = false,
}: MatchScoreProps) {
  const winner = matchWinner(match, match.targetScore);
  // Compact (télécommande) : 2 lignes par côté, « − score + » puis « blanche · −F · F · +F ».
  const compact = size === 'compact' && Boolean(controls);
  const sides: Array<{ player: PlayerId; name: string; color: string }> = [
    { player: 1, name: displayPlayerName(p1Name, 1, match.sides), color: p1Color },
    { player: 2, name: displayPlayerName(p2Name, 2, match.sides), color: p2Color },
  ];

  return (
    <section
      className={`match-bar${controls ? ' match-bar-controller' : ' match-bar-display'} match-size-${size}`}
      aria-label="Score du match"
    >
      {sides.map(({ player, name, color }) => {
        const isBreaker = match.breaker === player;
        const won = winner === player;
        const ball = match.showBreaker ? (
          controls ? (
            <button
              type="button"
              className={`match-ball${isBreaker ? ' active' : ''}`}
              aria-label={isBreaker ? `${name} casse (appuyer pour inverser)` : `Donner la casse à ${name}`}
              aria-pressed={isBreaker}
              onClick={controls.onToggleBreaker}
            />
          ) : (
            <span
              className={`match-ball${isBreaker ? ' active' : ''}`}
              role={isBreaker ? 'img' : undefined}
              aria-label={isBreaker ? `${name} casse` : undefined}
              aria-hidden={isBreaker ? undefined : true}
            />
          )
        ) : null;
        return (
          <div
            key={player}
            className={`match-side${isBreaker && match.showBreaker ? ' is-breaker' : ''}${won ? ' is-winner' : ''}`}
            style={{ borderColor: won ? color : undefined }}
          >
            {showNames ? <p className="match-name">{name}</p> : null}
            {controls && !compact && ball ? <div className="match-ball-row">{ball}</div> : null}
            <div className="match-main">
              {controls ? null : ball}
              {controls ? (
                <button
                  type="button"
                  className="match-step"
                  aria-label={`Retirer une manche à ${name}`}
                  onClick={() => controls.onScore(player, -1)}
                >
                  −
                </button>
              ) : null}
              <span className="match-score" aria-live="polite" aria-label={`Score ${name}`} style={{ color }}>
                {match.scores[player]}
              </span>
              {controls ? (
                <button
                  type="button"
                  className="match-step match-step-plus"
                  aria-label={`Ajouter une manche à ${name}`}
                  onClick={() => controls.onScore(player, 1)}
                >
                  +
                </button>
              ) : null}
            </div>
            {match.showFerme || (compact && match.showBreaker) ? (
              <div className="match-ferme-row">
                {compact ? ball : null}
                {controls && match.showFerme ? (
                  <button
                    type="button"
                    className="match-ferme-step"
                    aria-label={`Retirer une casse ferme à ${name}`}
                    onClick={() => controls.onFerme(player, -1)}
                  >
                    −
                  </button>
                ) : null}
                {match.showFerme ? (
                  <span className="match-ferme" aria-label={`Casses fermes ${name}`}>
                    <abbr title="Casses fermes">F</abbr> {match.fermes[player]}
                  </span>
                ) : null}
                {controls && match.showFerme ? (
                  <button
                    type="button"
                    className="match-ferme-step"
                    aria-label={`Ajouter une casse ferme à ${name}`}
                    onClick={() => controls.onFerme(player, 1)}
                  >
                    +
                  </button>
                ) : null}
              </div>
            ) : null}
            {won ? <p className="match-win">VICTOIRE</p> : null}
          </div>
        );
      })}
      {!controls && match.lagPending ? (
        <p className="match-lag-note" role="status">
          Tirage à la bande en cours…
        </p>
      ) : null}
    </section>
  );
}
