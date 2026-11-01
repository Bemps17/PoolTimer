import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { computeTimerFontSize, showsApresCasseControl } from '../timer/config';
import { canUseExtension, getDigitState, getFlashClass } from '../timer/engine';
import { formatSecondsClock, formatTime } from '../timer/format';
import { shouldAcceptControlActivation } from '../timer/screenTap';
import { useTimerScreenTap } from '../hooks/useTimerScreenTap';
import type { EngineState, PlayerId, TimerConfig } from '../timer/types';
import { PauseIcon, PlayIcon, ResetIcon, SettingsIcon } from './Icons';
import { PlayerStatus } from './PlayerStatus';

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
  /** Scoreur 1v1 (score, F, blanche), affiché sous les bandeaux joueurs. */
  matchBar?: ReactNode;
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
  matchBar,
}: ScoreboardProps) {
  const screenRef = useRef<HTMLElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const playButtonPointerAtRef = useRef(0);
  const newGameHoldRef = useRef<{ timer: number | null; unlockedThisPress: boolean }>({
    timer: null,
    unlockedThisPress: false,
  });

  // Taille des chiffres = place réellement libre pour eux (hors APRÈS CASSE / EXTENSION), sinon ils repoussent
  // les boutons d'action sous la barre de commandes quand le score occupe de la hauteur.
  const resizeTimer = useCallback(() => {
    const area = contentRef.current;
    const timer = timerRef.current;
    if (!area || !timer) return;
    const width = area.clientWidth - 8;
    const height = area.clientHeight - 8;
    timer.style.fontSize = `${computeTimerFontSize(width, height, config.tailleChiffres)}px`;
  }, [config.tailleChiffres]);

  useEffect(() => {
    resizeTimer();
    const area = contentRef.current;
    const observer = new ResizeObserver(resizeTimer);
    if (area) observer.observe(area);
    window.addEventListener('resize', resizeTimer);
    document.addEventListener('fullscreenchange', resizeTimer);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeTimer);
      document.removeEventListener('fullscreenchange', resizeTimer);
    };
  }, [resizeTimer, state.remainingTime, config.affichageMs]);

  useEffect(() => {
    return () => {
      if (newGameHoldRef.current.timer !== null) window.clearTimeout(newGameHoldRef.current.timer);
    };
  }, []);

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

  const screenTap = useTimerScreenTap({
    isRunning: state.isRunning,
    onTogglePlayPause,
    onResetShot,
    ignoreSelector: '.timer-action-bar',
  });

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
  const showApresCasse = showsApresCasseControl(config);

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
    <main
      id="app"
      className={`scoreboard-body${flashClass ? ` ${flashClass}` : ''}${
        config.modeInterface === 'tactile' ? ' tactile-mode' : ''
      }`}
      aria-label="H8timer — chronomètre de tir billard"
    >
      <h1 className="visually-hidden">H8timer — Chronomètre billard avec télécommande et écran miroir</h1>
      <header className="top-bar">
        <div className="top-bar-players">
          <PlayerStatus
            name={config.p1Name}
            color={config.p1Color}
            seat={1}
            active={state.currentPlayer === 1}
            extensionUsed={state.extensionsUsedInGame[1]}
            sides={config.matchOptions.sides}
            onSelect={() => onSelectPlayer(1)}
          />
          <PlayerStatus
            name={config.p2Name}
            color={config.p2Color}
            seat={2}
            active={state.currentPlayer === 2}
            extensionUsed={state.extensionsUsedInGame[2]}
            sides={config.matchOptions.sides}
            onSelect={() => onSelectPlayer(2)}
          />
        </div>
        {matchBar}
      </header>

      <section
        className="timer-screen"
        id="timerScreen"
        aria-label="Chronomètre"
        ref={screenRef}
        onPointerUp={screenTap.onPointerUp}
        onClick={screenTap.onClick}
      >
        <div className="timer-content" ref={contentRef}>
          <div className={`timer-officiel ${digitClass}`} id="timerDisplay" ref={timerRef}>
            {displayText}
          </div>
        </div>
        <div className="timer-action-row">
          {showApresCasse ? (
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
          ) : null}
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
      </section>

      <nav className="control-panel" id="controlPanel" aria-label="Commandes du chronomètre">
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
      </nav>
    </main>
  );
}

