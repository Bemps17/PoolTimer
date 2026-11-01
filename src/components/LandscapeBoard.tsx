import type { MirrorMatch } from '../mirror/protocol';
import type { SyncLevel } from '../mirror/syncLevel';
import { showsApresCasseControl } from '../timer/config';
import { canUseExtension, getDigitState, getFlashClass } from '../timer/engine';
import { formatSecondsClock, formatTime } from '../timer/format';
import { displayPlayerName } from '../timer/playerName';
import type { EngineState, PlayerId, TimerConfig } from '../timer/types';
import { haptic, type BoardActions } from './boardActions';
import { FitText } from './FitText';
import { HoldButton } from './HoldButton';
import { PauseIcon, PlayIcon, ResetIcon, SettingsIcon } from './Icons';
import { RemotePreview } from './RemotePreview';

interface LandscapeBoardProps extends BoardActions {
  config: TimerConfig;
  state: EngineState;
  /** Score du match (absent = score désactivé : noms seuls). */
  match?: MirrorMatch;
  /** Salle ouverte : le centre devient l'aperçu de l'écran distant, avec son voyant. */
  remoteLevel?: SyncLevel;
  /** Score sur les côtés (option « Score sur l'écran du téléphone ») ; l'aperçu distant le garde toujours. */
  scoreOnSides?: boolean;
  menuOpen: boolean;
  onScore: (player: PlayerId, delta: number) => void;
}

const DIGIT_CLASS = { default: 'state-default', warning: 'state-warning', critical: 'state-critical' } as const;

/** Paysage : joueur 1 à gauche, chrono et commandes au centre, joueur 2 à droite. */
export function LandscapeBoard({
  config,
  state,
  match,
  remoteLevel,
  scoreOnSides = true,
  menuOpen,
  onTogglePlayPause,
  onResetShot,
  onApresCasse,
  onExtension,
  onNewGame,
  onSelectPlayer,
  onToggleMenu,
  onScore,
}: LandscapeBoardProps) {
  const feedback = () => haptic(config.vibration);
  const extensionEnabled = canUseExtension(state);
  const showApresCasse = showsApresCasseControl(config);
  const flashClass = remoteLevel ? '' : getFlashClass(state.remainingTime, state.isRunning, config);

  const sideMatch = scoreOnSides ? match : undefined;

  const side = (seat: PlayerId) => {
    const name = displayPlayerName(seat === 1 ? config.p1Name : config.p2Name, seat, config.matchOptions.sides);
    const color = seat === 1 ? config.p1Color : config.p2Color;
    const active = state.currentPlayer === seat;
    const breaks = Boolean(sideMatch?.showBreaker && sideMatch.breaker === seat);
    return (
      <section
        data-zone={`p${seat}`}
        className={`landscape-side${active ? ' active' : ''}`}
        style={active ? { borderColor: color, boxShadow: `0 0 12px ${color}80` } : undefined}
      >
        <button
          type="button"
          className="landscape-select"
          aria-label={`Au tour de ${name}`}
          aria-pressed={active}
          onClick={() => {
            feedback();
            onSelectPlayer(seat);
          }}
        >
          <FitText className="landscape-name" singleLine minFontPx={9}>
            {name}
          </FitText>
          {sideMatch ? (
            <span className="landscape-score" aria-label={`Score ${name}`} style={{ color }}>
              {sideMatch.scores[seat]}
            </span>
          ) : null}
          <span className="landscape-meta">
            {breaks ? <span className="match-ball active" role="img" aria-label={`${name} casse`} /> : null}
            {sideMatch?.showFerme ? (
              <span className="landscape-ferme" aria-label={`Casses fermes ${name}`}>
                F {sideMatch.fermes[seat]}
              </span>
            ) : null}
            <span className={`ext-status ${state.extensionsUsedInGame[seat] ? 'ext-used' : 'ext-available'}`}>EXT</span>
          </span>
        </button>
        {sideMatch ? (
          <div className="landscape-steps">
            <button
              type="button"
              className="match-step"
              aria-label={`Retirer une manche à ${name}`}
              onClick={() => onScore(seat, -1)}
            >
              −
            </button>
            <button
              type="button"
              className="match-step match-step-plus"
              aria-label={`Ajouter une manche à ${name}`}
              onClick={() => {
                feedback();
                onScore(seat, 1);
              }}
            >
              +
            </button>
          </div>
        ) : null}
      </section>
    );
  };

  return (
    <main
      id="app"
      className={`scoreboard-body landscape-board${remoteLevel ? ' is-remote' : ''}${flashClass ? ` ${flashClass}` : ''}`}
      aria-label="H8timer — chronomètre (paysage)"
    >
      <h1 className="visually-hidden">H8timer — Chronomètre billard, disposition paysage</h1>
      {side(1)}
      <div data-zone="center" className="landscape-center">
        {remoteLevel ? (
          <RemotePreview config={config} state={state} match={match} level={remoteLevel} />
        ) : (
          <div className="landscape-timer">
            <div
              id="timerDisplay"
              className={`timer-officiel ${DIGIT_CLASS[getDigitState(state.remainingTime, config)]}`}
              style={{ ['--digit-scale' as string]: String(config.tailleChiffres / 100) }}
            >
              {formatTime(state.remainingTime, config.affichageMs)}
            </div>
          </div>
        )}
        <div className="landscape-actions">
          <button
            type="button"
            id="btnPlayPause"
            className={`landscape-action landscape-play${state.isRunning ? ' playing' : ''}`}
            aria-label={state.isRunning ? 'Pause' : 'Démarrer'}
            onClick={() => {
              feedback();
              onTogglePlayPause();
            }}
          >
            {state.isRunning ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            id="btnResetShot"
            className="landscape-action"
            aria-label="Nouveau coup"
            onClick={() => {
              feedback();
              onResetShot();
            }}
          >
            <ResetIcon />
          </button>
          <button
            type="button"
            className={`landscape-action landscape-ext${extensionEnabled ? '' : ' disabled'}`}
            aria-label={`Extension +${config.tempsExtension} s`}
            aria-disabled={!extensionEnabled}
            onClick={() => {
              if (!extensionEnabled) return;
              feedback();
              onExtension();
            }}
          >
            <span aria-hidden>+{config.tempsExtension}</span>
          </button>
          {showApresCasse ? (
            <button
              type="button"
              className={`landscape-action landscape-casse${state.shotKind === 'apresCasse' ? ' active-shot' : ''}`}
              aria-label={`Après casse ${formatSecondsClock(config.tempsApresCasse)}`}
              onClick={() => {
                feedback();
                onApresCasse();
              }}
            >
              <span aria-hidden>Casse</span>
            </button>
          ) : null}
          <HoldButton
            id="btnNewGame"
            className="landscape-action"
            label="Nouvelle manche"
            onConfirm={() => {
              feedback();
              onNewGame();
            }}
          >
            NEW
          </HoldButton>
          <button
            type="button"
            id="menuArbitre"
            className={`landscape-action${menuOpen ? ' active' : ''}`}
            aria-label="Ouvrir le menu"
            aria-pressed={menuOpen}
            onClick={onToggleMenu}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
      {side(2)}
    </main>
  );
}
