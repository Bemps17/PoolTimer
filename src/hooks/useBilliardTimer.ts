import { useCallback, useEffect, useRef, useState } from 'react';
import { effectiveVolumeDb } from '../audio/loudness';
import { initializeAudio, playSound, preloadAlertPack, syncMasterLevel, vibrate } from '../audio/toneAudio';
import { loadConfig, saveConfig } from '../timer/config';
import {
  canUseExtension,
  createInitialState,
  maybeAutoStart,
  newGame as newGameState,
  pauseTimer,
  selectPlayer as selectPlayerState,
  setupApresCasse,
  setupNewShot,
  startTimer,
  tick,
  applyThemeToDocument,
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
    applyThemeToDocument(config.theme, config.colors);
  }, [config.theme, config.colors]);

  useEffect(() => {
    syncMasterLevel(config);
  }, [config.volume, config.volumeMode]);

  useEffect(() => {
    preloadAlertPack(config);
  }, [config]);

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
    await initializeAudio(effectiveVolumeDb(configRef.current));
  }, []);

  const playClick = useCallback(() => {
    void ensureAudio().then(() => playSound('click', configRef.current));
  }, [ensureAudio]);

  const togglePlayPause = useCallback(() => {
    playClick();
    apply((current) => (current.isRunning ? pauseTimer(current, Date.now()) : startTimer(current, Date.now())));
  }, [apply, playClick]);

  const resetShot = useCallback(() => {
    playClick();
    apply((current) => {
      const reset = setupNewShot(current, configRef.current);
      return maybeAutoStart(reset, configRef.current, Date.now());
    });
  }, [apply, playClick]);

  const triggerApresCasse = useCallback(() => {
    playClick();
    apply((current) => setupApresCasse(current, configRef.current));
  }, [apply, playClick]);

  const selectPlayer = useCallback(
    (player: PlayerId) => {
      const samePlayer = stateRef.current.currentPlayer === player;
      if (samePlayer && !configRef.current.autoStartOnPlayerSelect) return;
      playClick();
      apply((current) => selectPlayerState(current, player, configRef.current, Date.now()));
    },
    [apply, playClick],
  );

  /** Nouvelle manche ; `firstPlayer` = casseur (sinon joueur 1). */
  const newGame = useCallback(
    (firstPlayer?: PlayerId) => {
      playClick();
      apply((current) => newGameState(current, configRef.current, firstPlayer === 2 ? 2 : 1));
    },
    [apply, playClick],
  );

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
