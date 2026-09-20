import { describe, expect, it } from 'vitest';
import { applyFfbPreset, getDefaultConfig, mergeConfig } from './config';
import {
  canUseExtension,
  createInitialState,
  getDigitState,
  newGame,
  pauseTimer,
  selectPlayer,
  setupApresCasse,
  setupNewShot,
  startTimer,
  tick,
  useExtension,
} from './engine';
import { formatSecondsClock, formatTime } from './format';

const config = getDefaultConfig();

describe('formatTime', () => {
  it('pads whole seconds above 10s', () => {
    expect(formatTime(45000, true)).toBe('45');
    expect(formatTime(90000, false)).toBe('90');
  });

  it('shows tenths under 10s when enabled', () => {
    expect(formatTime(9500, true)).toBe('9.5');
    expect(formatTime(9500, false)).toBe('10');
  });
});

describe('formatSecondsClock', () => {
  it('formats FFB post-break duration', () => {
    expect(formatSecondsClock(90)).toBe('1:30');
    expect(formatSecondsClock(45)).toBe('45s');
  });
});

describe('mergeConfig', () => {
  it('fills tempsApresCasse for legacy saved configs', () => {
    const merged = mergeConfig({ tempsBase: 40, tempsExtension: 15, theme: 'cyberpunk' });
    expect(merged.tempsBase).toBe(40);
    expect(merged.tempsExtension).toBe(15);
    expect(merged.tempsApresCasse).toBe(90);
    expect(merged.theme).toBe('cyberpunk');
  });

  it('applies the FFB Blackball preset', () => {
    const preset = applyFfbPreset({ ...getDefaultConfig(), tempsBase: 30, tempsExtension: 15, tempsApresCasse: 60 });
    expect(preset.tempsBase).toBe(45);
    expect(preset.tempsApresCasse).toBe(90);
    expect(preset.tempsExtension).toBe(45);
  });
});

describe('shot clock engine', () => {
  it('starts a game on base shot time', () => {
    const state = createInitialState(config);
    expect(state.remainingTime).toBe(45_000);
    expect(state.shotKind).toBe('base');
    expect(state.currentPlayer).toBe(1);
    expect(state.extensionsUsedInGame).toEqual({ 1: false, 2: false });
  });

  it('loads configurable post-break time on Après casse, then returns to base on new shot', () => {
    let state = startTimer(createInitialState(config), 0);
    state = setupApresCasse(state, config);
    expect(state.shotKind).toBe('apresCasse');
    expect(state.remainingTime).toBe(90_000);
    expect(state.isRunning).toBe(false);

    state = startTimer(state, 0);
    expect(state.isRunning).toBe(true);

    state = setupNewShot(state, config);
    expect(state.shotKind).toBe('base');
    expect(state.remainingTime).toBe(45_000);
    expect(state.isRunning).toBe(false);
  });

  it('returns to base time when the player changes after Après casse', () => {
    let state = setupApresCasse(createInitialState(config), config);
    state = selectPlayer(state, 2, config);
    expect(state.currentPlayer).toBe(2);
    expect(state.shotKind).toBe('base');
    expect(state.remainingTime).toBe(45_000);
  });

  it('allows one extension per player per game', () => {
    let state = startTimer(createInitialState(config), 1_000);
    expect(canUseExtension(state)).toBe(true);

    state = useExtension(state, config, 1_000);
    expect(state.isExtensionUsedForShot).toBe(true);
    expect(state.extensionsUsedInGame[1]).toBe(true);
    expect(state.remainingTime).toBe(45_000 + 45_000);
    expect(canUseExtension(state)).toBe(false);

    state = setupNewShot(state, config);
    state = startTimer(state, 2_000);
    expect(canUseExtension(state)).toBe(false);

    state = selectPlayer(state, 2, config);
    state = startTimer(state, 3_000);
    expect(canUseExtension(state)).toBe(true);

    state = useExtension(state, config, 3_000);
    expect(state.extensionsUsedInGame[2]).toBe(true);

    state = newGame(state, config);
    expect(state.extensionsUsedInGame).toEqual({ 1: false, 2: false });
    expect(state.currentPlayer).toBe(1);
    expect(state.shotKind).toBe('base');
  });

  it('does not grant an extension while paused', () => {
    let state = createInitialState(config);
    state = useExtension(state, config, 0);
    expect(state.extensionsUsedInGame[1]).toBe(false);
    expect(state.remainingTime).toBe(45_000);
  });

  it('fires the warning then the gong when time elapses', () => {
    let state = startTimer(createInitialState(config), 0);
    const warning = tick(state, config, 30_000);
    expect(warning.effects).toContainEqual({ type: 'sound', sound: 'warning' });
    expect(getDigitState(warning.state.remainingTime, config)).toBe('warning');

    state = warning.state;
    const expired = tick(state, config, 45_001);
    expect(expired.state.remainingTime).toBe(0);
    expect(expired.state.isRunning).toBe(false);
    expect(expired.effects).toContainEqual({ type: 'sound', sound: 'gong' });
  });

  it('does not start from zero remaining time', () => {
    const expired = { ...createInitialState(config), remainingTime: 0 };
    expect(startTimer(expired, 10).isRunning).toBe(false);
    expect(pauseTimer(createInitialState(config)).isRunning).toBe(false);
  });
});
