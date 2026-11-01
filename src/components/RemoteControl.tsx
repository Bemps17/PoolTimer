import type { MirrorMatch } from '../mirror/protocol';
import type { SyncLevel } from '../mirror/syncLevel';
import { showsApresCasseControl } from '../timer/config';
import { canUseExtension } from '../timer/engine';
import { formatSecondsClock } from '../timer/format';
import type { EngineState, TimerConfig } from '../timer/types';
import { haptic, type BoardActions } from './boardActions';
import { HoldButton } from './HoldButton';
import { PauseIcon, PlayIcon, ResetIcon, SettingsIcon } from './Icons';
import { PlayerStatus } from './PlayerStatus';
import { RemotePreview } from './RemotePreview';

interface RemoteControlProps extends BoardActions {
  config: TimerConfig;
  state: EngineState;
  /** Score tel qu'envoyé à l'écran distant (absent = score non affiché). */
  match?: MirrorMatch;
  level: SyncLevel;
  menuOpen: boolean;
}

/**
 * Télécommande dédiée (salle miroir ouverte, portrait) : l'aperçu de l'écran distant en haut,
 * un très gros Départ / Pause, puis les actions du coup. Le score se règle dans ⚙️ → Match.
 */
export function RemoteControl({
  config,
  state,
  match,
  level,
  menuOpen,
  onTogglePlayPause,
  onResetShot,
  onApresCasse,
  onExtension,
  onNewGame,
  onSelectPlayer,
  onToggleMenu,
}: RemoteControlProps) {
  const feedback = () => haptic(config.vibration);
  const extensionEnabled = canUseExtension(state);
  const showApresCasse = showsApresCasseControl(config);

  return (
    <main id="app" className="scoreboard-body remote-board" aria-label="H8timer — télécommande">
      <h1 className="visually-hidden">H8timer — Télécommande de l’écran distant</h1>
      <RemotePreview
        config={config}
        state={state}
        match={match}
        level={level}
        headerAction={
          <button
            type="button"
            id="menuArbitre"
            className={`remote-menu-btn${menuOpen ? ' active' : ''}`}
            aria-label="Ouvrir le menu"
            aria-pressed={menuOpen}
            onClick={onToggleMenu}
          >
            <SettingsIcon />
          </button>
        }
      />

      <div className="remote-players">
        <PlayerStatus
          name={config.p1Name}
          color={config.p1Color}
          seat={1}
          active={state.currentPlayer === 1}
          extensionUsed={state.extensionsUsedInGame[1]}
          sides={config.matchOptions.sides}
          onSelect={() => {
            feedback();
            onSelectPlayer(1);
          }}
        />
        <PlayerStatus
          name={config.p2Name}
          color={config.p2Color}
          seat={2}
          active={state.currentPlayer === 2}
          extensionUsed={state.extensionsUsedInGame[2]}
          sides={config.matchOptions.sides}
          onSelect={() => {
            feedback();
            onSelectPlayer(2);
          }}
        />
      </div>

      <button
        type="button"
        id="btnPlayPause"
        className={`remote-play${state.isRunning ? ' playing' : ''}`}
        aria-label={state.isRunning ? 'Pause' : 'Démarrer'}
        onClick={() => {
          feedback();
          onTogglePlayPause();
        }}
      >
        {state.isRunning ? <PauseIcon /> : <PlayIcon />}
        <span aria-hidden>{state.isRunning ? 'Pause' : 'Départ'}</span>
      </button>

      <div className="remote-actions">
        <button
          type="button"
          id="btnResetShot"
          className="remote-action"
          aria-label="Nouveau coup"
          onClick={() => {
            feedback();
            onResetShot();
          }}
        >
          <ResetIcon />
          <span aria-hidden>Nouveau coup</span>
        </button>
        <button
          type="button"
          className={`remote-action remote-action-ext${extensionEnabled ? '' : ' disabled'}`}
          aria-label={`Extension +${config.tempsExtension} s`}
          aria-disabled={!extensionEnabled}
          onClick={() => {
            if (!extensionEnabled) return;
            feedback();
            onExtension();
          }}
        >
          <span aria-hidden>+{config.tempsExtension} s</span>
          <small aria-hidden>Extension</small>
        </button>
        {showApresCasse ? (
          <button
            type="button"
            className={`remote-action remote-action-casse${state.shotKind === 'apresCasse' ? ' active-shot' : ''}`}
            aria-label={`Après casse ${formatSecondsClock(config.tempsApresCasse)}`}
            onClick={() => {
              feedback();
              onApresCasse();
            }}
          >
            <span aria-hidden>Après casse</span>
            <small aria-hidden>{formatSecondsClock(config.tempsApresCasse)}</small>
          </button>
        ) : null}
        <HoldButton
          id="btnNewGame"
          className="remote-action"
          label="Nouvelle manche"
          onConfirm={() => {
            feedback();
            onNewGame();
          }}
        >
          Nouvelle manche
        </HoldButton>
      </div>

    </main>
  );
}
