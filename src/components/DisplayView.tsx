import { useCallback, useEffect, useRef } from 'react';
import { computeTimerFontSize } from '../timer/config';
import { getDigitState, getFlashClass } from '../timer/engine';
import { formatTime } from '../timer/format';
import { useDisplayMirror } from '../hooks/useMirror';
import { useFullscreen } from '../hooks/useFullscreen';
import { formatRoomCode } from '../mirror/protocol';

interface DisplayViewProps {
  room: string;
}

export function DisplayView({ room }: DisplayViewProps) {
  const { status, error, snapshot, remainingTime, controllerConnected } = useDisplayMirror(room);
  const { isFullscreen, toggle } = useFullscreen();
  const screenRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const config = snapshot?.config;

  useEffect(() => {
    document.getElementById('root')?.classList.add('display-mode');
    return () => {
      document.getElementById('root')?.classList.remove('display-mode');
    };
  }, []);

  const resizeTimer = useCallback(() => {
    const screen = screenRef.current;
    const timer = timerRef.current;
    if (!screen || !timer) return;
    const scale = config?.tailleChiffres ?? 120;
    timer.style.fontSize = `${computeTimerFontSize(screen.clientWidth - 24, screen.clientHeight - 24, scale)}px`;
  }, [config?.tailleChiffres]);

  useEffect(() => {
    resizeTimer();
    const screen = screenRef.current;
    const observer = new ResizeObserver(resizeTimer);
    if (screen) observer.observe(screen);
    window.addEventListener('resize', resizeTimer);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeTimer);
    };
  }, [resizeTimer, remainingTime, config?.affichageMs]);

  const digitState = config ? getDigitState(remainingTime, config) : 'default';
  const flashClass = config ? getFlashClass(remainingTime, snapshot?.isRunning ?? false, config) : '';
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

  const statusLabel = (() => {
    switch (status) {
      case 'live':
        return controllerConnected ? 'Salle active' : 'En attente de la télécommande';
      case 'connecting':
        return 'Connexion…';
      case 'error':
        return error ?? 'Erreur de connexion';
      case 'idle':
        return 'Inactif';
      default: {
        const exhaustive: never = status;
        return exhaustive;
      }
    }
  })();

  return (
    <div
      className={`display-root${flashClass ? ` ${flashClass}` : ''}`}
      onClick={() => {
        void toggle();
      }}
      role="presentation"
    >
      <div className="display-top">
        <span className="beta-badge">Bêta</span>
        <span className="display-room">{formatRoomCode(room)}</span>
        <span className={`display-status display-status-${status}`}>{statusLabel}</span>
      </div>
      {config ? (
        <div className="display-players">
          <div
            className={`player-status${snapshot?.currentPlayer === 1 ? ' active' : ''}`}
            style={
              snapshot?.currentPlayer === 1
                ? { borderColor: config.p1Color, boxShadow: `0 0 10px ${config.p1Color}80` }
                : undefined
            }
          >
            <span className="player-name">{config.p1Name}</span>
            <span className={`ext-status ${snapshot?.extensionsUsedInGame[1] ? 'ext-used' : 'ext-available'}`}>
              EXT
            </span>
          </div>
          <div
            className={`player-status${snapshot?.currentPlayer === 2 ? ' active' : ''}`}
            style={
              snapshot?.currentPlayer === 2
                ? { borderColor: config.p2Color, boxShadow: `0 0 10px ${config.p2Color}80` }
                : undefined
            }
          >
            <span className="player-name">{config.p2Name}</span>
            <span className={`ext-status ${snapshot?.extensionsUsedInGame[2] ? 'ext-used' : 'ext-available'}`}>
              EXT
            </span>
          </div>
        </div>
      ) : null}
      <div className="display-screen" ref={screenRef}>
        <div className={`timer-officiel ${digitClass}`} ref={timerRef}>
          {formatTime(remainingTime, config?.affichageMs ?? true)}
        </div>
      </div>
      <p className="display-hint">
        {isFullscreen ? 'Affichage miroir — lecture seule' : 'Appui : plein écran — lecture seule'}
      </p>
    </div>
  );
}
