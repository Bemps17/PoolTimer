import type { ReactNode } from 'react';
import type { MirrorMatch } from '../mirror/protocol';
import type { SyncLevel } from '../mirror/syncLevel';
import { getDigitState } from '../timer/engine';
import { formatTime } from '../timer/format';
import { displayPlayerName } from '../timer/playerName';
import type { EngineState, PlayerId, TimerConfig } from '../timer/types';
import { FitText } from './FitText';
import { SyncDot } from './SyncDot';

interface RemotePreviewProps {
  config: TimerConfig;
  state: EngineState;
  /** Score envoyé à l'écran (absent = l'écran distant n'affiche pas le score). */
  match?: MirrorMatch;
  level: SyncLevel;
  /** Bouton placé à droite de l'en-tête (⚙️ sur la télécommande portrait). */
  headerAction?: ReactNode;
}

const DIGIT_CLASS = { default: 'state-default', warning: 'state-warning', critical: 'state-critical' } as const;

/**
 * Aperçu en direct de l'écran distant : mêmes données que celles envoyées au relais
 * (joueur au tir, extensions, score s'il est affiché, chiffres et couleurs d'alerte).
 */
export function RemotePreview({ config, state, match, level, headerAction }: RemotePreviewProps) {
  const sides = config.matchOptions.sides;
  const players: Array<{ seat: PlayerId; name: string; color: string }> = [
    { seat: 1, name: displayPlayerName(config.p1Name, 1, sides), color: config.p1Color },
    { seat: 2, name: displayPlayerName(config.p2Name, 2, sides), color: config.p2Color },
  ];
  const digitClass = DIGIT_CLASS[getDigitState(state.remainingTime, config)];

  return (
    <section className="remote-preview" role="group" aria-label="Aperçu de l’écran distant">
      <header className="remote-preview-label">
        <SyncDot level={level} />
        <span>Écran distant</span>
        {headerAction ? <span className="remote-preview-action">{headerAction}</span> : null}
      </header>
      <div className={`remote-preview-screen display-layout-${config.viewOptions.displayLayout}`}>
        <div className="remote-preview-players">
          {players.map(({ seat, name, color }) => {
            const active = state.currentPlayer === seat;
            return (
              <div
                key={seat}
                className={`remote-preview-player${active ? ' active' : ''}`}
                style={active ? { borderColor: color } : undefined}
              >
                <FitText className="remote-preview-name" singleLine minFontPx={8}>
                  {name}
                </FitText>
                {match ? (
                  <span className="remote-preview-score" style={{ color }}>
                    {match.scores[seat]}
                    {match.showFerme ? <small> F{match.fermes[seat]}</small> : null}
                  </span>
                ) : null}
                <span className={`remote-preview-ext ${state.extensionsUsedInGame[seat] ? 'ext-used' : 'ext-available'}`}>
                  EXT
                </span>
              </div>
            );
          })}
        </div>
        <div className="remote-preview-timer">
          <span className={`timer-officiel ${digitClass}`}>{formatTime(state.remainingTime, config.affichageMs)}</span>
        </div>
      </div>
    </section>
  );
}
