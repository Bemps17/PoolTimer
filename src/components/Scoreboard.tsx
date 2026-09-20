import { useCallback, useEffect, useRef } from 'react';
import { canUseExtension, getDigitState, getFlashClass } from '../timer/engine';
import { formatSecondsClock, formatTime } from '../timer/format';
import type { EngineState, PlayerId, TimerConfig } from '../timer/types';
import { CompressIcon, ExpandIcon, PauseIcon, PlayIcon, ResetIcon, SettingsIcon } from './Icons';

interface ScoreboardProps {
  config: TimerConfig;
  state: EngineState;
  menuOpen: boolean;
  isFullscreen: boolean;
  onTogglePlayPause: () => void;
  onResetShot: () => void;
  onApresCasse: () => void;
  onExtension: () => void;
  onNewGame: () => void;
  onSelectPlayer: (player: PlayerId) => void;
  onToggleMenu: () => void;
  onToggleFullscreen: () => void;
}

export function Scoreboard({
  config,
  state,
  menuOpen,
  isFullscreen,
  onTogglePlayPause,
  onResetShot,
  onApresCasse,
  onExtension,
  onNewGame,
  onSelectPlayer,
  onToggleMenu,
  onToggleFullscreen,
}: ScoreboardProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const lastClickRef = useRef(0);
  const clickTimeoutRef = useRef<number | null>(null);

  const resizeTimer = useCallback(() => {
    const screen = screenRef.current;
    const timer = timerRef.current;
    if (!screen || !timer) return;
    const screenWidth = screen.clientWidth - 32;
    const screenHeight = screen.clientHeight - 32;
    let fontSize = screenWidth * 0.55;
    if (fontSize > screenHeight) {
      fontSize = screenHeight * 0.9;
    }
    timer.style.fontSize = `${fontSize}px`;
  }, []);

  useEffect(() => {
    resizeTimer();
    const screen = screenRef.current;
    const observer = new ResizeObserver(resizeTimer);
    if (screen) observer.observe(screen);
    window.addEventListener('resize', resizeTimer);
    document.addEventListener('fullscreenchange', resizeTimer);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeTimer);
      document.removeEventListener('fullscreenchange', resizeTimer);
    };
  }, [resizeTimer, state.remainingTime, config.affichageMs]);

  const handleTimerScreenClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('.timer-action-bar')) return;

    const now = Date.now();
    if (now - lastClickRef.current < 300) {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      onResetShot();
      lastClickRef.current = 0;
    } else {
      clickTimeoutRef.current = window.setTimeout(() => {
        onTogglePlayPause();
        clickTimeoutRef.current = null;
      }, 300);
    }
    lastClickRef.current = now;
  };

  const digitState = getDigitState(state.remainingTime, config);
  const flashClass = getFlashClass(state.remainingTime, state.isRunning, config);
  const extensionEnabled = canUseExtension(state);
  const extUsedCurrent = state.extensionsUsedInGame[state.currentPlayer];
  const displayText = formatTime(state.remainingTime, config.affichageMs);

  const digitClass = (() => {
    switch (digitState) {
      case 'critical':
        return 'state-critical';
      case 'warning':
        return 'state-warning';
      case 'default':
        return 'state-default';
      default: {
        const exhaustive: never = digitState;
        return exhaustive;
      }
    }
  })();

  return (
    <div
      className={`scoreboard-body${flashClass ? ` ${flashClass}` : ''}${
        config.modeInterface === 'tactile' ? ' tactile-mode' : ''
      }`}
    >
      <div className="top-bar">
        <div className="top-bar-players">
          <PlayerChip
            player={1}
            name={config.p1Name}
            color={config.p1Color}
            active={state.currentPlayer === 1}
            extensionUsed={state.extensionsUsedInGame[1]}
            onSelect={onSelectPlayer}
          />
          <PlayerChip
            player={2}
            name={config.p2Name}
            color={config.p2Color}
            active={state.currentPlayer === 2}
            extensionUsed={state.extensionsUsedInGame[2]}
            onSelect={onSelectPlayer}
          />
        </div>
        <div className="top-bar-controls">
          <div
            className="icon-button"
            id="btnFullScreen"
            role="button"
            tabIndex={0}
            aria-label="Plein écran"
            aria-pressed={isFullscreen}
            onClick={onToggleFullscreen}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') onToggleFullscreen();
            }}
          >
            <ExpandIcon />
            <CompressIcon />
          </div>
          <div
            className={`icon-button${menuOpen ? ' active' : ''}`}
            id="menuArbitre"
            role="button"
            tabIndex={0}
            aria-label="Ouvrir le menu"
            onClick={onToggleMenu}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') onToggleMenu();
            }}
          >
            <SettingsIcon />
          </div>
        </div>
      </div>

      <div className="timer-screen" id="timerScreen" ref={screenRef} onClick={handleTimerScreenClick}>
        <div className="timer-content">
          <div className={`timer-officiel ${digitClass}`} id="timerDisplay" ref={timerRef}>
            {displayText}
          </div>
        </div>
        <div className="timer-action-row">
          <button
            type="button"
            className={`timer-action-bar timer-casse-bar${state.shotKind === 'apresCasse' ? ' active-shot' : ''}`}
            onClick={(event) => {
              event.stopPropagation();
              onApresCasse();
            }}
            aria-label={`Après casse ${formatSecondsClock(config.tempsApresCasse)}`}
          >
            APRÈS CASSE
          </button>
          <button
            type="button"
            className={`timer-action-bar timer-extension-bar${extensionEnabled ? '' : ' disabled'}${
              extUsedCurrent ? ' game-used' : ''
            }`}
            onClick={(event) => {
              event.stopPropagation();
              if (extensionEnabled) onExtension();
            }}
            aria-label={`Extension +${config.tempsExtension}s`}
            aria-disabled={!extensionEnabled}
          >
            EXTENSION
          </button>
        </div>
      </div>

      <div className="control-panel" id="controlPanel">
        <button className="bouton-sport" id="btnResetShot" aria-label="Nouveau coup" onClick={onResetShot}>
          <ResetIcon />
        </button>
        <button
          className={`bouton-sport${state.isRunning ? ' playing' : ''}`}
          id="btnPlayPause"
          aria-label={state.isRunning ? 'Pause' : 'Démarrer'}
          onClick={onTogglePlayPause}
        >
          {state.isRunning ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button className="bouton-sport bouton-carré" id="btnNewGame" aria-label="Nouvelle manche" onClick={onNewGame}>
          NEW
        </button>
      </div>
    </div>
  );
}

interface PlayerChipProps {
  player: PlayerId;
  name: string;
  color: string;
  active: boolean;
  extensionUsed: boolean;
  onSelect: (player: PlayerId) => void;
}

function PlayerChip({ player, name, color, active, extensionUsed, onSelect }: PlayerChipProps) {
  return (
    <div
      className={`player-status${active ? ' active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(player)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect(player);
      }}
      style={
        active
          ? { borderColor: color, boxShadow: `0 0 10px ${color}80` }
          : { borderColor: 'transparent', boxShadow: 'none' }
      }
    >
      <span className="player-name">{name}</span>{' '}
      <span className={`ext-status ${extensionUsed ? 'ext-used' : 'ext-available'}`}>EXT</span>
    </div>
  );
}
