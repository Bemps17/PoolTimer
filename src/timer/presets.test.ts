import { describe, expect, it } from 'vitest';
import { FFB_BLACKBALL_MASTER_PRESET, getDefaultConfig, matchesCompetitionPreset } from './config';
import {
  addPreset,
  applyPreset,
  builtinTimings,
  describeTimings,
  diffTimings,
  duplicatePreset,
  matchesPreset,
  mergePresets,
  PRESET_NAME_MAX,
  PRESETS_MAX,
  removePreset,
  renamePreset,
  sanitizePresetName,
  sanitizeTimings,
} from './presets';
import { loadPresets, PRESETS_STORAGE_KEY, savePresets } from './presetsStorage';

const timings = { tempsBase: 40, tempsApresCasse: 80, tempsExtension: 20, seuilAlerte: 12, seuilCritique: 4 };
const seqRandom = () => {
  let i = 0;
  return () => (i += 0.013);
};

describe('presets personnalisés', () => {
  it('creates, renames, duplicates and removes with unique ids', () => {
    let list = addPreset([], { name: ' Ma ligue ', timings, raceTo: 5 }, { random: seqRandom(), now: () => 1 });
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: 'Ma ligue', raceTo: 5, tempsBase: 40, createdAt: 1 });
    list = duplicatePreset(list, list[0]!.id, { random: seqRandom(), now: () => 1 });
    expect(list).toHaveLength(2);
    expect(list[1]!.name).toBe('Ma ligue (copie)');
    expect(new Set(list.map((p) => p.id)).size).toBe(2);
    list = renamePreset(list, list[1]!.id, 'Copie B');
    expect(list[1]!.name).toBe('Copie B');
    list = removePreset(list, list[0]!.id);
    expect(list.map((p) => p.name)).toEqual(['Copie B']);
  });

  it('caps the number of presets and ignores unknown ids', () => {
    let list: ReturnType<typeof addPreset> = [];
    for (let i = 0; i < PRESETS_MAX + 5; i += 1) list = addPreset(list, { name: `P${i}`, timings }, { random: Math.random });
    expect(list).toHaveLength(PRESETS_MAX);
    expect(duplicatePreset(list, 'nope')).toHaveLength(PRESETS_MAX);
  });

  it('sanitizes names (control chars, markup, length, empty)', () => {
    expect(sanitizePresetName('  a\n\tb  ')).toBe('a b');
    expect(sanitizePresetName('<img src=x onerror=1>')).not.toMatch(/[<>]/);
    expect(sanitizePresetName('x'.repeat(200))).toHaveLength(PRESET_NAME_MAX);
    expect(sanitizePresetName('   ')).toBe('Mon preset');
    expect(sanitizePresetName(42)).toBe('Mon preset');
  });

  it('clamps timings and keeps critical <= warning', () => {
    const t = sanitizeTimings({ tempsBase: 1, tempsApresCasse: 9999, tempsExtension: 'x', seuilAlerte: 10, seuilCritique: 50 }, timings);
    expect(t.tempsBase).toBe(10);
    expect(t.tempsApresCasse).toBe(180);
    expect(t.tempsExtension).toBe(timings.tempsExtension);
    expect(t.seuilCritique).toBeLessThanOrEqual(t.seuilAlerte);
  });

  it('validates stored lists: junk, duplicate ids, oversize', () => {
    expect(mergePresets('x')).toEqual([]);
    const list = mergePresets([
      null,
      { id: 'a', name: 'A', ...timings },
      { id: 'a', name: 'B', ...timings },
      { id: '<bad id>', name: 'C', tempsBase: 'zz' },
      ...Array.from({ length: 100 }, (_, i) => ({ id: `x${i}`, name: `n${i}`, ...timings })),
    ]);
    expect(list.length).toBeLessThanOrEqual(PRESETS_MAX);
    expect(new Set(list.map((p) => p.id)).size).toBe(list.length);
    expect(list.every((p) => /^[A-Za-z0-9_-]+$/.test(p.id))).toBe(true);
    expect(list[2]!.tempsBase).toBe(getDefaultConfig().tempsBase);
  });

  it('applies timings and race-to without touching appearance or sounds', () => {
    const config = getDefaultConfig();
    const [preset] = addPreset([], { name: 'Custom', timings, raceTo: 7 }, { random: seqRandom() });
    const next = applyPreset({ ...config, theme: 'cyberpunk', alertPack: 'cretins' }, preset!);
    expect(next).toMatchObject({ tempsBase: 40, tempsExtension: 20, theme: 'cyberpunk', alertPack: 'cretins' });
    expect(next.matchOptions.targetScore).toBe(7);
    expect(next.competitionMode).toBeNull();
    expect(matchesPreset(next, preset!)).toBe(true);
    const [noRace] = addPreset([], { name: 'Sans course', timings }, { random: seqRandom() });
    expect(applyPreset({ ...config, matchOptions: { ...config.matchOptions, targetScore: 9 } }, noRace!).matchOptions.targetScore).toBe(9);
  });

  it('a custom preset equal to a built-in is detected as that built-in', () => {
    const [preset] = addPreset([], { name: 'Master bis', timings: builtinTimings('ffbMaster') }, { random: seqRandom() });
    const next = applyPreset(getDefaultConfig(), preset!);
    expect(matchesCompetitionPreset(next, 'ffbMaster')).toBe(true);
    expect(next.competitionMode).toBe('ffbMaster');
    expect(FFB_BLACKBALL_MASTER_PRESET.tempsBase).toBe(30);
  });

  it('describes and diffs timings for the preview', () => {
    expect(describeTimings(builtinTimings('ffb'))).toBe('45s · 1:30 · +15s');
    expect(describeTimings(builtinTimings('fbep'))).toBe('45s · +15s');
    expect(diffTimings(builtinTimings('ffb'), builtinTimings('ffbMaster'))).toContain('base 45→30 s');
    expect(diffTimings(builtinTimings('ffb'), builtinTimings('ffb'))).toBe('');
  });

  it('round-trips through storage and survives corruption', () => {
    const data = new Map<string, string>();
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
    const list = addPreset([], { name: 'Stocké', timings, raceTo: 3 }, { random: seqRandom() });
    savePresets(list, storage);
    expect(loadPresets(storage)).toEqual(list);
    data.set(PRESETS_STORAGE_KEY, '{oops');
    expect(loadPresets(storage)).toEqual([]);
  });
});

describe('aperçu court des changements (toast lisible sur téléphone)', () => {
  it('shows at most two changes then "+ n autres"', async () => {
    const { summarizeTimingChanges } = await import('./presets');
    const ffb = builtinTimings('ffb');
    const master = builtinTimings('ffbMaster');
    expect(summarizeTimingChanges(ffb, master)).toBe('base 45→30 s · après casse 90→60 s + 2 autres');
    expect(summarizeTimingChanges(ffb, { ...ffb, tempsBase: 40 })).toBe('base 45→40 s');
    expect(summarizeTimingChanges(ffb, ffb)).toBe('');
    expect(summarizeTimingChanges(ffb, { ...ffb, tempsBase: 40, tempsExtension: 20, seuilAlerte: 9 }, 3)).toBe(
      'base 45→40 s · extension 15→20 s · alerte 15→9 s',
    );
    expect(summarizeTimingChanges(ffb, master, 1)).toBe('base 45→30 s + 3 autres');
  });
});
