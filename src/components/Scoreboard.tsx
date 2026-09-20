import { useCallback, useEffect, useRef } from 'react';
import { computeTimerFontSize } from '../timer/config';
import { canUseExtension, getDigitState, getFlashClass } from '../timer/engine';
import { formatSecondsClock, formatTime } from '../timer/format';
import { DOUBLE_TAP_MS, createScreenTapSession, resolveTimerScreenTap, shouldAcceptControlActivation } from '../timer/screenTap';
import type { EngineState, PlayerId, TimerConfig } from '../timer/types';
import { PauseIcon, PlayIcon, ResetIcon, SettingsIcon } from './Icons';

interface ScoreboardProps {
  config: TimerConfig;
  state: EngineState;
  menuOpen: boolean;
  onTogglePlayPause: () => void;
  onResetShot: () => void;
  onApresCasse: () => void;
  onExtension: () => void;
  onNewGame: () => void;
  onSelectPlayer: (player: PlayerId) => void;
  onToggleMenu: () => void;
  onToggleMinions: () => void;
}

export function Scoreboard({
  config,
  state,
  menuOpen,
  onTogglePlayPause,
  onResetShot,
  onApresCasse,
  onExtension,
  onNewGame,
  onSelectPlayer,
  onToggleMenu,
  onToggleMinions,
}: ScoreboardProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const tapSessionRef = useRef(createScreenTapSession());
  const playTimeoutRef = useRef<number | null>(null);
  const playButtonPointerAtRef = useRef(0);
  const isRunningRef = useRef(state.isRunning);
  isRunningRef.current = state.isRunning;
  const newGameHoldRef = useRef<{ timer: number | null; unlockedThisPress: boolean }>({
    timer: null,
    unlockedThisPress: false,
  });

  const resizeTimer = useCallback(() => {
    const screen = screenRef.current;
    const timer = timerRef.current;
    if (!screen || !timer) return;
    const screenWidth = screen.clientWidth - 16;
    const screenHeight = screen.clientHeight - 16;
    timer.style.fontSize = `${computeTimerFontSize(screenWidth, screenHeight, config.tailleChiffres)}px`;
  }, [config.tailleChiffres]);

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
      if (playTimeoutRef.current) window.clearTimeout(playTimeoutRef.current);
      if (newGameHoldRef.current.timer !== null) window.clearTimeout(newGameHoldRef.current.timer);
    };
  }, [resizeTimer, state.remainingTime, config.affichageMs]);

  const clearNewGameHold = () => {
    if (newGameHoldRef.current.timer !== null) {
      window.clearTimeout(newGameHoldRef.current.timer);
      newGameHoldRef.current.timer = null;
    }
  };

  const handleNewGamePointerDown = () => {
    newGameHoldRef.current.unlockedThisPress = false;
    newGameHoldRef.current.timer = window.setTimeout(() => {
      newGameHoldRef.current.unlockedThisPress = true;
      newGameHoldRef.current.timer = null;
      onToggleMinions();
    }, 1200);
  };

  const handleNewGamePointerUp = () => {
    const unlockedThisPress = newGameHoldRef.current.unlockedThisPress;
    clearNewGameHold();
    if (!unlockedThisPress) onNewGame();
  };

  const handleNewGamePointerCancel = () => {
    clearNewGameHold();
    newGameHoldRef.current.unlockedThisPress = false;
  };

  const handleTimerScreenTap = (kind: 'pointer' | 'click', event: { target: EventTarget | null; button?: number }) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.timer-action-bar')) return;
    if (typeof event.button === 'number' && event.button !== 0) return;

    const result = resolveTimerScreenTap({
      isRunning: isRunningRef.current,
      now: Date.now(),
      kind,
      session: tapSessionRef.current,
    });
    tapSessionRef.current = result.session;

    const clearPendingPlay = () => {
      if (playTimeoutRef.current !== null) {
        window.clearTimeout(playTimeoutRef.current);
        playTimeoutRef.current = null;
      }
    };

    switch (result.action) {
      case 'ignore':
        return;
      case 'pause':
        clearPendingPlay();
        isRunningRef.current = false;
        onTogglePlayPause();
        return;
      case 'arm-play':
        clearPendingPlay();
        playTimeoutRef.current = window.setTimeout(() => {
          playTimeoutRef.current = null;
          onTogglePlayPause();
        }, DOUBLE_TAP_MS);
        return;
      case 'reset':
        clearPendingPlay();
        onResetShot();
        return;
      default: {
        const exhaustive: never = result.action;
        return exhaustive;
      }
    }
  };

  const handlePlayPauseControl = (kind: 'pointer' | 'click', event: { button?: number }) => {
    if (typeof event.button === 'number' && event.button !== 0) return;
    const next = shouldAcceptControlActivation(kind, Date.now(), playButtonPointerAtRef.current);
    playButtonPointerAtRef.current = next.lastPointerAt;
    if (next.accept) onTogglePlayPause();
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
      </div>

      <div
        className="timer-screen"
        id="timerScreen"
        ref={screenRef}
        onPointerUp={(event) => {
          if (event.pointerType !== 'mouse') event.preventDefault();
          handleTimerScreenTap('pointer', event);
        }}
        onClick={(event) => handleTimerScreenTap('click', event)}
      >
        <div className="timer-content">
          <div className={`timer-officiel ${digitClass}`} id="timerDisplay" ref={timerRef}>
            {displayText}
          </div>
        </div>
        <div className="timer-action-row">
          <button
            type="button"
            className={`timer-action-bar timer-casse-bar${state.shotKind === 'apresCasse' ? ' active-shot' : ''}`}
            onPointerUp={(event) => event.stopPropagation()}
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
            onPointerUp={(event) => event.stopPropagation()}
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
        <button
          className="bouton-sport control-game-btn"
          id="btnResetShot"
          aria-label="Nouveau coup"
          onClick={onResetShot}
        >
          <ResetIcon />
        </button>
        <button
          type="button"
          className={`bouton-sport control-game-btn${state.isRunning ? ' playing' : ''}`}
          id="btnPlayPause"
          aria-label={state.isRunning ? 'Pause' : 'Démarrer'}
          onPointerUp={(event) => {
            event.stopPropagation();
            if (event.pointerType !== 'mouse') event.preventDefault();
            handlePlayPauseControl('pointer', event);
          }}
          onClick={(event) => {
            event.stopPropagation();
            handlePlayPauseControl('click', event);
          }}
        >
          {state.isRunning ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          className="bouton-sport bouton-carré control-game-btn"
          id="btnNewGame"
          aria-label="Nouvelle manche"
          onPointerDown={handleNewGamePointerDown}
          onPointerUp={handleNewGamePointerUp}
          onPointerCancel={handleNewGamePointerCancel}
          onClick={(event) => {
            if (event.detail > 0) return;
            onNewGame();
          }}
          onContextMenu={(event) => event.preventDefault()}
        >
          NEW
        </button>
        <button
          type="button"
          className={`bouton-sport${menuOpen ? ' active' : ''}`}
          id="menuArbitre"
          aria-label="Ouvrir le menu"
          aria-pressed={menuOpen}
          onClick={onToggleMenu}
        >
          <SettingsIcon />
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
      <span className="player-name">{name}</span>
      <span className={`ext-status ${extensionUsed ? 'ext-used' : 'ext-available'}`}>EXT</span>
    </div>
  );
}
