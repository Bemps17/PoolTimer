import { describe, expect, it } from 'vitest';
import { getDefaultConfig } from '../timer/config';
import { minionsToggleMessage, shouldPlayMinionsArghh, toggleMinionsMode } from './minions';

const base = getDefaultConfig();

describe('shouldPlayMinionsArghh', () => {
  it('plays the Minions clip only for the first warning alert', () => {
    const config = { ...base, minionsMode: true, sonAlertes: true };
    expect(shouldPlayMinionsArghh('warning', config)).toBe(true);
    expect(shouldPlayMinionsArghh('countdown_tick', config)).toBe(false);
    expect(shouldPlayMinionsArghh('gong', config)).toBe(false);
    expect(shouldPlayMinionsArghh('click', config)).toBe(false);
  });

  it('respects the sonAlertes mute and stays off when the mode is disabled', () => {
    expect(shouldPlayMinionsArghh('warning', { ...base, minionsMode: true, sonAlertes: false })).toBe(false);
    expect(shouldPlayMinionsArghh('warning', { ...base, minionsMode: false, sonAlertes: true })).toBe(false);
  });
});

describe('toggleMinionsMode', () => {
  it('unlocks and enables Minions from a long-press when the mode is off', () => {
    const next = toggleMinionsMode(base);
    expect(next.minionsUnlocked).toBe(true);
    expect(next.minionsMode).toBe(true);
    expect(minionsToggleMessage(next.minionsMode)).toBe('Mode Minions activé');
  });

  it('disables Minions from a long-press while keeping the setting unlocked', () => {
    const next = toggleMinionsMode({ ...base, minionsUnlocked: true, minionsMode: true });
    expect(next.minionsUnlocked).toBe(true);
    expect(next.minionsMode).toBe(false);
    expect(minionsToggleMessage(next.minionsMode)).toBe('Mode Minions désactivé');
  });

  it('turns Minions back on after it was disabled', () => {
    const next = toggleMinionsMode({ ...base, minionsUnlocked: true, minionsMode: false });
    expect(next.minionsUnlocked).toBe(true);
    expect(next.minionsMode).toBe(true);
  });
});
