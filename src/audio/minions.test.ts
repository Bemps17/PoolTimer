import { describe, expect, it } from 'vitest';
import { getDefaultConfig } from '../timer/config';
import { shouldPlayMinionsArghh } from './minions';

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
