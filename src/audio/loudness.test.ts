import { describe, expect, it } from 'vitest';
import { getDefaultConfig, mergeConfig } from '../timer/config';
import { boostDb, effectiveVolumeDb, isVolumeMode, LIMITER_THRESHOLD_DB, LOUDNESS_BOOST_DB, MAX_VOLUME_DB } from './loudness';

describe('volume maximum des alertes', () => {
  it('defaults to maximum output (0 dB) with a +6 dB boost and a limiter below 0 dBFS', () => {
    const config = getDefaultConfig();
    expect(config.volumeMode).toBe('max');
    expect(effectiveVolumeDb(config)).toBe(MAX_VOLUME_DB);
    expect(boostDb(config)).toBe(LOUDNESS_BOOST_DB);
    expect(LIMITER_THRESHOLD_DB).toBeLessThan(0);
  });

  it('maximum mode ignores an old quiet slider value', () => {
    expect(effectiveVolumeDb({ volumeMode: 'max', volume: -20 })).toBe(0);
  });

  it('custom mode follows the slider, never above 0 dB, without boost', () => {
    expect(effectiveVolumeDb({ volumeMode: 'custom', volume: -12 })).toBe(-12);
    expect(effectiveVolumeDb({ volumeMode: 'custom', volume: 9 })).toBe(0);
    expect(effectiveVolumeDb({ volumeMode: 'custom', volume: Number.NaN })).toBe(0);
    expect(boostDb({ volumeMode: 'custom' })).toBe(0);
  });

  it('migrates v2.10 configs (volume -10, no mode) to maximum, and keeps a chosen custom mode', () => {
    expect(mergeConfig({ volume: -10 }).volumeMode).toBe('max');
    expect(mergeConfig({ volume: -10, volumeMode: 'custom' }).volumeMode).toBe('custom');
    expect(mergeConfig({ volumeMode: 'loud!!' }).volumeMode).toBe('max');
    expect(isVolumeMode('max')).toBe(true);
    expect(isVolumeMode('x')).toBe(false);
  });
});
