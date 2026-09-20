import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applyCompetitionPreset,
  applyFfbPreset,
  computeTimerFontSize,
  FBEP_AMBIANCE,
  FFB_AMBIANCE,
  getDefaultConfig,
  mergeConfig,
  TIMER_DIGIT_WIDTH_RATIO,
} from './config';
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
  themeBodyClass,
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
    expect(merged.autoStartOnPlayerSelect).toBe(false);
    expect(merged.tailleChiffres).toBe(100);
  });

  it('restores FFB and FBEP themes from storage', () => {
    expect(mergeConfig({ theme: 'ffb' }).theme).toBe('ffb');
    expect(mergeConfig({ theme: 'fbep' }).theme).toBe('fbep');
  });

  it('persists autoStartOnPlayerSelect when present', () => {
    const merged = mergeConfig({ autoStartOnPlayerSelect: true });
    expect(merged.autoStartOnPlayerSelect).toBe(true);
  });

  it('persists and clamps the timer digit size', () => {
    expect(mergeConfig({ tailleChiffres: 120 }).tailleChiffres).toBe(120);
    expect(mergeConfig({ tailleChiffres: 20 }).tailleChiffres).toBe(60);
    expect(mergeConfig({ tailleChiffres: 200 }).tailleChiffres).toBe(140);
  });

  it('keeps Minions mode hidden until unlocked', () => {
    const merged = mergeConfig({ tempsBase: 45 });
    expect(merged.minionsUnlocked).toBe(false);
    expect(merged.minionsMode).toBe(false);
  });

  it('restores an unlocked Minions preference from storage', () => {
    const merged = mergeConfig({ minionsMode: true });
    expect(merged.minionsMode).toBe(true);
    expect(merged.minionsUnlocked).toBe(true);
  });

  it('applies FFB Blackball timings and blue ambiance without resetting après casse', () => {
    const preset = applyCompetitionPreset(
      { ...getDefaultConfig(), tempsBase: 30, tempsExtension: 45, tempsApresCasse: 60, seuilAlerte: 20, theme: 'sombre' },
      'ffb',
    );
    expect(preset.tempsBase).toBe(45);
    expect(preset.tempsExtension).toBe(15);
    expect(preset.seuilAlerte).toBe(15);
    expect(preset.seuilCritique).toBe(5);
    expect(preset.tempsApresCasse).toBe(60);
    expect(preset.theme).toBe('ffb');
  });

  it('applies Ultimate FBEP with the same timings and teal ambiance', () => {
    const preset = applyCompetitionPreset({ ...getDefaultConfig(), tempsApresCasse: 75 }, 'fbep');
    expect(preset.tempsBase).toBe(45);
    expect(preset.tempsExtension).toBe(15);
    expect(preset.tempsApresCasse).toBe(75);
    expect(preset.theme).toBe('fbep');
  });

  it('keeps applyFfbPreset as the Blackball competition mode', () => {
    const preset = applyFfbPreset({ ...getDefaultConfig(), tempsExtension: 45, tempsApresCasse: 60 });
    expect(preset.tempsExtension).toBe(15);
    expect(preset.tempsApresCasse).toBe(60);
    expect(preset.theme).toBe('ffb');
  });

  it('maps competition themes to body classes', () => {
    expect(themeBodyClass('ffb')).toBe('theme-ffb');
    expect(themeBodyClass('fbep')).toBe('theme-fbep');
    expect(themeBodyClass('sombre')).toBe('');
  });

  it('pins FFB blue and FBEP vert canard accents in CSS', () => {
    expect(FFB_AMBIANCE).toBe('#0066CC');
    expect(FBEP_AMBIANCE).toBe('#007879');
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
    const ffbBlock = css.slice(css.indexOf('body.theme-ffb'), css.indexOf('body.theme-fbep'));
    const fbepBlock = css.slice(css.indexOf('body.theme-fbep'), css.indexOf('* {'));
    expect(ffbBlock).toContain('--c-primary: #0066CC');
    expect(ffbBlock).toContain('--c-ambiance: #0066CC');
    expect(fbepBlock).toContain('--c-primary: #007879');
    expect(fbepBlock).toContain('--c-ambiance: #007879');
    expect(css).toContain('border-color: #007879');
    expect(css).toContain('border-color: #0066CC');
  });
});

describe('computeTimerFontSize', () => {
  it('uses a larger default than the previous 0.55 width ratio', () => {
    expect(TIMER_DIGIT_WIDTH_RATIO).toBeGreaterThan(0.55);
    expect(computeTimerFontSize(400, 400, 100)).toBe(300);
    expect(computeTimerFontSize(400, 400, 100)).toBeGreaterThan(400 * 0.55);
  });

  it('scales with the configured digit size and respects the height cap', () => {
    expect(computeTimerFontSize(400, 400, 80)).toBe(240);
    expect(computeTimerFontSize(400, 200, 100)).toBe(190);
    expect(computeTimerFontSize(400, 400, 200)).toBe(computeTimerFontSize(400, 400, 140));
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
    expect(state.isRunning).toBe(false);
  });

  it('does not restart when clicking the already active player if autoStartOnPlayerSelect is off', () => {
    let state = startTimer(createInitialState(config), 1_000);
    state = { ...state, remainingTime: 12_000 };
    const next = selectPlayer(state, 1, config, 2_000);
    expect(next).toBe(state);
    expect(next.remainingTime).toBe(12_000);
    expect(next.isRunning).toBe(true);
  });

  it('resets to base time and starts when autoStartOnPlayerSelect is on', () => {
    const enabled = { ...config, autoStartOnPlayerSelect: true };
    let state = setupApresCasse(createInitialState(enabled), enabled);
    state = selectPlayer(state, 2, enabled, 5_000);
    expect(state.currentPlayer).toBe(2);
    expect(state.shotKind).toBe('base');
    expect(state.remainingTime).toBe(45_000);
    expect(state.isRunning).toBe(true);
    expect(state.expectedTime).toBe(5_000 + 45_000);
  });

  it('relances the shot clock when clicking the already active player if autoStartOnPlayerSelect is on', () => {
    const enabled = { ...config, autoStartOnPlayerSelect: true };
    let state = startTimer(createInitialState(enabled), 1_000);
    state = { ...state, remainingTime: 8_000, shotKind: 'apresCasse' };
    state = selectPlayer(state, 1, enabled, 9_000);
    expect(state.currentPlayer).toBe(1);
    expect(state.shotKind).toBe('base');
    expect(state.remainingTime).toBe(45_000);
    expect(state.isRunning).toBe(true);
    expect(state.expectedTime).toBe(9_000 + 45_000);
  });

  it('allows one extension per player per game', () => {
    let state = startTimer(createInitialState(config), 1_000);
    expect(canUseExtension(state)).toBe(true);

    state = useExtension(state, config, 1_000);
    expect(state.isExtensionUsedForShot).toBe(true);
    expect(state.extensionsUsedInGame[1]).toBe(true);
    expect(state.remainingTime).toBe(45_000 + 15_000);
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
