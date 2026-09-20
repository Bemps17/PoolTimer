import type { DigitState, Effect, EngineState, PlayerId, TickResult, TimerConfig } from './types';

function freshAlerts(): EngineState['alertsFired'] {
  return { warning: false, lastTickSecond: 999 };
}

export function createInitialState(config: TimerConfig): EngineState {
  return setupNewShot(
    {
      remainingTime: config.tempsBase * 1000,
      isRunning: false,
      currentPlayer: 1,
      extensionsUsedInGame: { 1: false, 2: false },
      isExtensionUsedForShot: false,
      shotKind: 'base',
      expectedTime: 0,
      alertsFired: freshAlerts(),
    },
    config,
  );
}

function applyShot(state: EngineState, durationSec: number, kind: EngineState['shotKind']): EngineState {
  return {
    ...state,
    isRunning: false,
    remainingTime: durationSec * 1000,
    isExtensionUsedForShot: false,
    shotKind: kind,
    expectedTime: 0,
    alertsFired: freshAlerts(),
  };
}

export function setupNewShot(state: EngineState, config: TimerConfig): EngineState {
  return applyShot(state, config.tempsBase, 'base');
}

export function setupApresCasse(state: EngineState, config: TimerConfig): EngineState {
  return applyShot(state, config.tempsApresCasse, 'apresCasse');
}

export function newGame(state: EngineState, config: TimerConfig): EngineState {
  return setupNewShot(
    {
      ...state,
      currentPlayer: 1,
      extensionsUsedInGame: { 1: false, 2: false },
    },
    config,
  );
}

export function selectPlayer(
  state: EngineState,
  player: PlayerId,
  config: TimerConfig,
  now = 0,
): EngineState {
  const samePlayer = state.currentPlayer === player;
  if (samePlayer && !config.autoStartOnPlayerSelect) {
    return state;
  }

  const reset = setupNewShot({ ...state, currentPlayer: player }, config);
  if (config.autoStartOnPlayerSelect) {
    return startTimer(reset, now);
  }
  return reset;
}

export function startTimer(state: EngineState, now: number): EngineState {
  if (state.isRunning || state.remainingTime <= 0) return state;
  return {
    ...state,
    isRunning: true,
    expectedTime: now + state.remainingTime,
  };
}

export function pauseTimer(state: EngineState, now = 0): EngineState {
  if (!state.isRunning) return state;
  const remainingTime =
    state.expectedTime > 0 ? Math.max(0, state.expectedTime - now) : Math.max(0, state.remainingTime);
  return { ...state, isRunning: false, remainingTime };
}

export function canUseExtension(state: EngineState): boolean {
  return state.isRunning && !state.isExtensionUsedForShot && !state.extensionsUsedInGame[state.currentPlayer];
}

export function useExtension(state: EngineState, config: TimerConfig, now: number): EngineState {
  if (!canUseExtension(state)) return state;

  const expectedTime = state.expectedTime + config.tempsExtension * 1000;
  const remainingTime = expectedTime - now;
  let { warning, lastTickSecond } = state.alertsFired;

  if (remainingTime > config.seuilAlerte * 1000) {
    warning = false;
  }
  if (remainingTime > 5000) {
    lastTickSecond = 999;
  }

  return {
    ...state,
    expectedTime,
    remainingTime,
    isExtensionUsedForShot: true,
    extensionsUsedInGame: {
      ...state.extensionsUsedInGame,
      [state.currentPlayer]: true,
    },
    alertsFired: { warning, lastTickSecond },
  };
}

export function tick(state: EngineState, config: TimerConfig, now: number): TickResult {
  if (!state.isRunning) {
    return { state, effects: [] };
  }

  const remainingTime = state.expectedTime - now;
  if (remainingTime <= 0) {
    return {
      state: {
        ...state,
        isRunning: false,
        remainingTime: 0,
      },
      effects: [
        { type: 'sound', sound: 'gong' },
        { type: 'vibrate', pattern: [300, 50, 300] },
      ],
    };
  }

  const next: EngineState = { ...state, remainingTime };
  const { alertsFired, effects } = collectAlerts(next, config);
  return { state: { ...next, alertsFired }, effects };
}

function collectAlerts(state: EngineState, config: TimerConfig): { alertsFired: EngineState['alertsFired']; effects: Effect[] } {
  const remainingSec = state.remainingTime / 1000;
  const currentWholeSecond = Math.floor(remainingSec);
  const effects: Effect[] = [];
  let { warning, lastTickSecond } = state.alertsFired;

  if (remainingSec <= config.seuilAlerte && !warning) {
    warning = true;
    effects.push({ type: 'sound', sound: 'warning' });
  }

  if (remainingSec <= 5 && state.isRunning && currentWholeSecond < lastTickSecond) {
    effects.push({ type: 'sound', sound: 'countdown_tick' });
    effects.push({ type: 'vibrate', pattern: 50 });
    lastTickSecond = currentWholeSecond;
  }

  return { alertsFired: { warning, lastTickSecond }, effects };
}

export function getDigitState(remainingTime: number, config: TimerConfig): DigitState {
  if (remainingTime <= config.seuilCritique * 1000 && remainingTime > 0) return 'critical';
  if (remainingTime <= config.seuilAlerte * 1000 && remainingTime > 0) return 'warning';
  return 'default';
}

export function getFlashClass(remainingTime: number, isRunning: boolean, config: TimerConfig): string {
  if (!isRunning || remainingTime <= 0) return '';
  const digit = getDigitState(remainingTime, config);
  switch (digit) {
    case 'critical':
      return 'is-flashing-critical';
    case 'warning':
      return 'is-flashing-warning';
    case 'default':
      return '';
    default: {
      const exhaustive: never = digit;
      return exhaustive;
    }
  }
}

export function maybeAutoStart(state: EngineState, config: TimerConfig, now: number): EngineState {
  if (!config.autoStartOnReset) return state;
  return startTimer(state, now);
}

export function themeBodyClass(theme: TimerConfig['theme']): string {
  switch (theme) {
    case 'sombre':
      return '';
    case 'light':
      return 'theme-light';
    case 'cyberpunk':
      return 'theme-cyberpunk';
    case 'ffb':
      return 'theme-ffb';
    case 'fbep':
      return 'theme-fbep';
    default: {
      const exhaustive: never = theme;
      return exhaustive;
    }
  }
}
