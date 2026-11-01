import { useEffect, useRef } from 'react';
import { DOUBLE_TAP_MS, createScreenTapSession, resolveTimerScreenTap, type TapKind } from '../timer/screenTap';

interface TimerScreenTapOptions {
  isRunning: boolean;
  onTogglePlayPause: () => void;
  onResetShot: () => void;
  /** Appuis ignorés quand ils partent d'un élément correspondant (ex. un bouton posé sur le chrono). */
  ignoreSelector?: string;
}

/**
 * Appuis sur la zone du chrono (portrait et paysage) : un appui = départ / pause (confirmé après le délai
 * de double appui), double appui = nouveau coup. Logique de décision pure dans `timer/screenTap.ts`.
 */
export function useTimerScreenTap({ isRunning, onTogglePlayPause, onResetShot, ignoreSelector }: TimerScreenTapOptions) {
  const session = useRef(createScreenTapSession());
  const pending = useRef<number | null>(null);
  const running = useRef(isRunning);
  running.current = isRunning;
  const toggle = useRef(onTogglePlayPause);
  toggle.current = onTogglePlayPause;
  const reset = useRef(onResetShot);
  reset.current = onResetShot;

  // Le délai d'un appui simple doit survivre aux re-rendus du chrono.
  useEffect(
    () => () => {
      if (pending.current !== null) window.clearTimeout(pending.current);
    },
    [],
  );

  const clearPending = () => {
    if (pending.current !== null) {
      window.clearTimeout(pending.current);
      pending.current = null;
    }
  };

  const handle = (kind: TapKind, event: { target: EventTarget | null; button?: number }) => {
    const target = event.target as HTMLElement | null;
    if (ignoreSelector && target?.closest?.(ignoreSelector)) return;
    if (typeof event.button === 'number' && event.button !== 0) return;

    const result = resolveTimerScreenTap({ isRunning: running.current, now: Date.now(), kind, session: session.current });
    session.current = result.session;

    switch (result.action) {
      case 'ignore':
        return;
      case 'arm-pause':
      case 'arm-play': {
        const wantRunning = result.action === 'arm-play';
        clearPending();
        pending.current = window.setTimeout(() => {
          pending.current = null;
          if (running.current !== wantRunning) {
            running.current = wantRunning;
            toggle.current();
          }
        }, DOUBLE_TAP_MS);
        return;
      }
      case 'reset':
        clearPending();
        running.current = false;
        reset.current();
        return;
      default: {
        const exhaustive: never = result.action;
        return exhaustive;
      }
    }
  };

  return {
    onPointerUp: (event: React.PointerEvent) => {
      if (event.pointerType !== 'mouse') event.preventDefault();
      handle('pointer', event);
    },
    onClick: (event: React.MouseEvent) => handle('click', event),
  };
}
