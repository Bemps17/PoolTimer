import { useCallback, useEffect, useRef } from 'react';
import { useDisplayMirror } from '../hooks/useMirror';
import type { OverlayOptions } from '../mirror/overlay';
import { computeTimerFontSize } from '../timer/config';
import { getDigitState } from '../timer/engine';
import { formatTime } from '../timer/format';
import { MatchScore } from './MatchScore';

interface OverlayViewProps {
  room: string;
  options: OverlayOptions;
}

/**
 * Source navigateur pour OBS Studio / Streamlabs : lecture seule, aucun texte d'interface,
 * fond transparent (ou sombre / vert chroma selon l'option).
 */
export function OverlayView({ room, options }: OverlayViewProps) {
  const { snapshot, remainingTime } = useDisplayMirror(room);
  const timerBoxRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const config = snapshot?.config;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'H8timer — Overlay stream';
    document.documentElement.classList.add('overlay-mode', `overlay-bg-${options.background}`);
    document.getElementById('root')?.classList.add('overlay-root-host');
    return () => {
      document.title = previousTitle;
      document.documentElement.classList.remove('overlay-mode', `overlay-bg-${options.background}`);
      document.getElementById('root')?.classList.remove('overlay-root-host');
    };
  }, [options.background]);

  const resizeTimer = useCallback(() => {
    const box = timerBoxRef.current;
    const timer = timerRef.current;
    if (!box || !timer) return;
    const size = computeTimerFontSize(box.clientWidth - 8, box.clientHeight - 8, 100);
    timer.style.fontSize = `${(size * options.scale) / 100}px`;
  }, [options.scale]);

  useEffect(() => {
    resizeTimer();
    const box = timerBoxRef.current;
    const observer = new ResizeObserver(resizeTimer);
    if (box) observer.observe(box);
    window.addEventListener('resize', resizeTimer);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeTimer);
    };
  }, [resizeTimer, remainingTime, options.parts]);

  const showTimer = options.parts !== 'score';
  const showScore = options.parts !== 'timer' && Boolean(snapshot?.match) && Boolean(config);
  const digitClass = config ? `state-${getDigitState(remainingTime, config)}` : 'state-default';

  if (!snapshot || !config) {
    return <main className={`overlay-root overlay-${options.layout}`} aria-label="Overlay H8timer" />;
  }

  return (
    <main className={`overlay-root overlay-${options.layout} overlay-parts-${options.parts}`} aria-label="Overlay H8timer">
      {showTimer ? (
        <div className="overlay-timer-box" ref={timerBoxRef}>
          <div className={`timer-officiel overlay-timer ${digitClass}`} ref={timerRef}>
            {formatTime(remainingTime, config.affichageMs)}
          </div>
        </div>
      ) : null}
      {showScore && snapshot.match ? (
        <div className="overlay-score-box">
          <MatchScore
            match={{
              ...snapshot.match,
              showFerme: snapshot.match.showFerme && options.showFerme,
              showBreaker: snapshot.match.showBreaker && options.showBreaker,
            }}
            p1Name={config.p1Name}
            p2Name={config.p2Name}
            p1Color={config.p1Color}
            p2Color={config.p2Color}
            showNames={options.showNames}
          />
        </div>
      ) : null}
    </main>
  );
}
