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

function applyEffects(effects: Effect[], config: TimerConfig, startNow: () => void): void {
  for (const effect of effects) {
    switch (effect.type) {
      case 'sound':
        playSound(effect.sound, config);
        break;
      case 'vibrate':
        vibrate(effect.pattern, config.vibration);
        break;
      case 'scheduleStart':
        window.setTimeout(startNow, effect.delayMs);
        break;
      default: {
        const exhaustive: never = effect;
        return exhaustive;
      }
    }
  }
}

export function useBilliardTimer() {
  const [config, setConfigState] = useState<TimerConfig>(() => loadConfig());
  const [state, setState] = useState<EngineState>(() => createInitialState(loadConfig()));
  const stateRef = useRef(state);
  const configRef = useRef(config);
  stateRef.current = state;
  configRef.current = config;

  const runEffects = useCallback((effects: Effect[]) => {
    applyEffects(effects, configRef.current, () => {
      setState((current) => startTimer(current, Date.now()));
    });
  }, []);

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

  const playClick = useCallback(async () => {
    await ensureAudio();
    playSound('click', configRef.current);
  }, [ensureAudio]);

  const startNow = useCallback(() => {
    setState((current) => startTimer(current, Date.now()));
  }, []);

  const togglePlayPause = useCallback(async () => {
    await playClick();
    setState((current) => (current.isRunning ? pauseTimer(current) : startTimer(current, Date.now())));
  }, [playClick]);

  const resetShot = useCallback(async () => {
    await playClick();
    setState((current) => {
      const reset = setupNewShot(current, configRef.current);
      if (!configRef.current.autoStartOnReset) return reset;
      window.setTimeout(() => startNow(), 50);
      return reset;
    });
  }, [playClick, startNow]);

  const triggerApresCasse = useCallback(async () => {
    await playClick();
    setState((current) => {
      const next = setupApresCasse(current, configRef.current);
      if (configRef.current.autoStartOnReset) {
        window.setTimeout(() => startNow(), 50);
      }
      return next;
    });
  }, [playClick, startNow]);

  const selectPlayer = useCallback(
    async (player: PlayerId) => {
      if (stateRef.current.currentPlayer === player) return;
      await playClick();
      setState((current) => selectPlayerState(current, player, configRef.current));
    },
    [playClick],
  );

  const newGame = useCallback(async () => {
    await playClick();
    setState((current) => newGameState(current, configRef.current));
  }, [playClick]);

  const useExtension = useCallback(async () => {
    await playClick();
    setState((current) => useExtensionState(current, configRef.current, Date.now()));
  }, [playClick]);

  const updateConfig = useCallback((next: TimerConfig, options?: { resetShot?: boolean }) => {
    setConfigState(next);
    saveConfig(next);
    if (options?.resetShot) {
      setState((current) => setupNewShot(current, next));
    }
  }, []);

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
