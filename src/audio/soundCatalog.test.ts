import { describe, expect, it } from 'vitest';
import {
  defaultIdsForPack,
  PACK_LABELS,
  pickAlertSound,
  sanitizeSoundIdList,
  toggleSoundId,
} from './soundCatalog';

describe('sound catalog', () => {
  it('labels original packs without franchise affiliation', () => {
    expect(PACK_LABELS.cretins).toContain('original');
    expect(PACK_LABELS.minionsLike).toContain('original');
    expect(PACK_LABELS.cretins.toLowerCase()).not.toContain('ubisoft');
    expect(PACK_LABELS.minionsLike.toLowerCase()).not.toContain('illumination');
  });

  it('picks the first id in fixed mode and a member in random mode', () => {
    const ids = ['a', 'b', 'c'];
    expect(pickAlertSound(ids, 'fixed')).toBe('a');
    expect(pickAlertSound(ids, 'random', () => 0)).toBe('a');
    expect(pickAlertSound(ids, 'random', () => 0.99)).toBe('c');
    expect(pickAlertSound([], 'random')).toBeUndefined();
  });

  it('defaults critical clips to 1s ticks or a 5s oneshot depending on style', () => {
    expect(defaultIdsForPack('classic', 'repeat').critical).toEqual(['classic-tick']);
    expect(defaultIdsForPack('classic', 'oneshot').critical).toEqual(['classic-oneshot5s']);
    expect(defaultIdsForPack('cretins', 'oneshot').critical).toEqual(['cretins-alerte5s']);
  });

  it('toggles selection and falls back when the list is empty', () => {
    expect(toggleSoundId(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleSoundId(['a', 'b'], 'a')).toEqual(['b']);
    expect(sanitizeSoundIdList(['x', '', 3], ['fallback'])).toEqual(['x']);
    expect(sanitizeSoundIdList([], ['fallback'])).toEqual(['fallback']);
  });
});
