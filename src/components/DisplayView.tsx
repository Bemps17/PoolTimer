import { useCallback, useEffect, useRef, useState } from 'react';
import { computeTimerFontSize } from '../timer/config';
import { getDigitState, getFlashClass } from '../timer/engine';
import { formatTime } from '../timer/format';
import { useDisplayMirror } from '../hooks/useMirror';
import { useFullscreen } from '../hooks/useFullscreen';
import { useKeepAwake } from '../hooks/useKeepAwake';
import { formatRoomCode } from '../mirror/protocol';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { MatchScore } from './MatchScore';
import { PlayerStatus } from './PlayerStatus';
import { SyncDot } from './SyncDot';

interface DisplayViewProps {
  room: string;
}

export function DisplayView({ room }: DisplayViewProps) {
  const { snapshot, remainingTime, sync, level, diagnostics, clearLog } = useDisplayMirror(room);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const { isFullscreen, toggle } = useFullscreen();
  // L'écran Visuel ne doit jamais se mettre en veille pendant un match.
  useKeepAwake(true);
  const screenRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const config = snapshot?.config;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'H8timer — Écran Visuel (miroir)';
    document.getElementById('root')?.classList.add('display-mode');
    return () => {
      document.title = previousTitle;
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

  const waiting = sync.waitingForSnapshot;
  const report = diagnosticsOpen ? diagnostics() : null;

  return (
    <main
      id="app"
      className={`display-root display-minimal display-layout-${config?.displayLayout ?? 'timer'}${flashClass ? ` ${flashClass}` : ''}`}
      aria-label="H8timer — écran Visuel en miroir"
    >
      <h1 className="visually-hidden">H8timer — Écran Visuel (miroir de la télécommande)</h1>
      {/* Vision allégée : un voyant (appui = diagnostic) et une icône plein écran, rien d'autre. */}
      <header className="display-top">
        <SyncDot level={level} onOpen={() => setDiagnosticsOpen(true)} />
        <button
          type="button"
          className="display-fullscreen-btn"
          aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          aria-pressed={isFullscreen}
          onClick={() => {
            void toggle();
          }}
        >
          <span aria-hidden>⛶</span>
        </button>
      </header>
      {config && snapshot?.match ? (
        <>
          <div className="display-players">
            <PlayerStatus
              name={config.p1Name}
              color={config.p1Color}
              seat={1}
              active={snapshot.currentPlayer === 1}
              extensionUsed={Boolean(snapshot.extensionsUsedInGame[1])}
              sides={snapshot.match.sides}
            />
            <PlayerStatus
              name={config.p2Name}
              color={config.p2Color}
              seat={2}
              active={snapshot.currentPlayer === 2}
              extensionUsed={Boolean(snapshot.extensionsUsedInGame[2])}
              sides={snapshot.match.sides}
            />
          </div>
          <MatchScore
            match={snapshot.match}
            p1Name={config.p1Name}
            p2Name={config.p2Name}
            p1Color={config.p1Color}
            p2Color={config.p2Color}
          />
        </>
      ) : null}
      <div className="display-screen" ref={screenRef}>
        {waiting ? (
          // Avant le premier état : seul le code de la salle, pour vérifier qu'on regarde la bonne.
          <p className="display-waiting" role="status" aria-label={`En attente de la télécommande, salle ${formatRoomCode(room)}`}>
            {formatRoomCode(room)}
          </p>
        ) : (
          <div className={`timer-officiel ${digitClass}`} ref={timerRef}>
            {formatTime(remainingTime, config?.affichageMs ?? true)}
          </div>
        )}
      </div>
      {report ? (
        <div className="lag-overlay" role="dialog" aria-modal="true" aria-labelledby="display-diagnostics-title">
          <div className="lag-card share-card">
            <h2 id="display-diagnostics-title">Diagnostic de l’écran</h2>
            <DiagnosticsPanel
              level={level}
              rows={report.rows}
              buildLog={report.buildLog}
              fileName={`h8timer-ecran-${room}.log`}
              onClear={clearLog}
            />
            <button type="button" className="bouton-menu bouton-menu-secondary" onClick={() => setDiagnosticsOpen(false)}>
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
