import { useCallback, useEffect, useRef, useState } from 'react';
import { initializeAudio, playSound, setAudioVolume, vibrate } from '../audio/toneAudio';
import { loadConfig, saveConfig } from '../timer/config';
import {
  canUseExtension,
  createInitialState,
  newGame as newGameState,
  pauseTimer,
  selectPlayer as selectPlayerState,
  setupApresCasse,
  setupNewShot,
  startTimer,
  tick,
  themeBodyClass,
  useExtension as useExtensionState,
} from '../timer/engine';
import type { Effect, EngineState, PlayerId, TimerConfig } from '../timer/types';

export function useBilliardTimer() {
  const [config, setConfigState] = useState<TimerConfig>(() => loadConfig());
  const [state, setState] = useState<EngineState>(() => createInitialState(loadConfig()));
  const stateRef = useRef(state);
  const configRef = useRef(config);
  configRef.current = config;

  const apply = useCallback((updater: (current: EngineState) => EngineState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
    return next;
  }, []);

  const runEffects = useCallback(
    (effects: Effect[]) => {
      for (const effect of effects) {
        switch (effect.type) {
          case 'sound':
            playSound(effect.sound, configRef.current);
            break;
          case 'vibrate':
            vibrate(effect.pattern, configRef.current.vibration);
            break;
          case 'scheduleStart':
            window.setTimeout(() => {
              apply((current) => startTimer(current, Date.now()));
            }, effect.delayMs);
            break;
          default: {
            const exhaustive: never = effect;
            return exhaustive;
          }
        }
      }
    },
    [apply],
  );

  useEffect(() => {
    const className = themeBodyClass(config.theme);
    document.body.classList.remove('theme-light', 'theme-cyberpunk');
    if (className) document.body.classList.add(className);
  }, [config.theme]);

  useEffect(() => {
    setAudioVolume(config.volume);
  }, [config.volume]);

  useEffect(() => {
    if (!state.isRunning) return undefined;
    const id = window.setInterval(() => {
      const { state: next, effects } = tick(stateRef.current, configRef.current, Date.now());
      stateRef.current = next;
      setState(next);
      if (effects.length > 0) runEffects(effects);
    }, 50);
    return () => window.clearInterval(id);
  }, [state.isRunning, runEffects]);

  const ensureAudio = useCallback(async () => {
    await initializeAudio(configRef.current.volume);
  }, []);

  const playClick = useCallback(() => {
    void ensureAudio().then(() => playSound('click', configRef.current));
  }, [ensureAudio]);

  const startNow = useCallback(() => {
    apply((current) => startTimer(current, Date.now()));
  }, [apply]);

  const togglePlayPause = useCallback(() => {
    playClick();
    apply((current) => (current.isRunning ? pauseTimer(current) : startTimer(current, Date.now())));
  }, [apply, playClick]);

  const resetShot = useCallback(() => {
    playClick();
    apply((current) => {
      const reset = setupNewShot(current, configRef.current);
      if (configRef.current.autoStartOnReset) {
        window.setTimeout(() => startNow(), 50);
      }
      return reset;
    });
  }, [apply, playClick, startNow]);

  const triggerApresCasse = useCallback(() => {
    playClick();
    apply((current) => setupApresCasse(current, configRef.current));
  }, [apply, playClick]);

  const selectPlayer = useCallback(
    (player: PlayerId) => {
      if (stateRef.current.currentPlayer === player) return;
      playClick();
      apply((current) => selectPlayerState(current, player, configRef.current));
    },
    [apply, playClick],
  );

  const newGame = useCallback(() => {
    playClick();
    apply((current) => newGameState(current, configRef.current));
  }, [apply, playClick]);

  const useExtension = useCallback(() => {
    playClick();
    apply((current) => useExtensionState(current, configRef.current, Date.now()));
  }, [apply, playClick]);

  const updateConfig = useCallback(
    (next: TimerConfig, options?: { resetShot?: boolean }) => {
      setConfigState(next);
      saveConfig(next);
      if (options?.resetShot) {
        apply((current) => setupNewShot(current, next));
      }
    },
    [apply],
  );

  return {
    config,
    state,
    canExtend: canUseExtension(state),
    togglePlayPause,
    resetShot,
    triggerApresCasse,
    selectPlayer,
    newGame,
    useExtension,
    updateConfig,
    ensureAudio,
    playClick,
  };
}
