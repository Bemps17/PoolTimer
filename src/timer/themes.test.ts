import { describe, expect, it } from 'vitest';
import { getDefaultConfig } from './config';
import { colorsForTheme } from './theme';
import { addTheme, applyCustomTheme, loadThemes, matchesTheme, mergeThemes, removeTheme, renameTheme, saveThemes, THEMES_MAX, THEMES_STORAGE_KEY } from './themes';

describe('thèmes personnalisés', () => {
  it('creates, renames, removes and applies without touching timings', () => {
    const colors = { ...colorsForTheme('cyberpunk'), primary: '#112233' };
    let list = addTheme([], { name: ' Mon néon ', base: 'cyberpunk', colors }, { now: () => 1 });
    expect(list[0]).toMatchObject({ name: 'Mon néon', base: 'cyberpunk', createdAt: 1 });
    list = renameTheme(list, list[0]!.id, 'Néon 2');
    expect(list[0]!.name).toBe('Néon 2');
    const config = getDefaultConfig();
    const next = applyCustomTheme(config, list[0]!);
    expect(next.theme).toBe('cyberpunk');
    expect(next.colors.primary).toBe('#112233');
    expect(next.tempsBase).toBe(config.tempsBase);
    expect(matchesTheme(next, list[0]!)).toBe(true);
    expect(matchesTheme(config, list[0]!)).toBe(false);
    expect(removeTheme(list, list[0]!.id)).toEqual([]);
  });

  it('caps the library and validates stored data', () => {
    let list: ReturnType<typeof addTheme> = [];
    for (let i = 0; i < THEMES_MAX + 3; i += 1) list = addTheme(list, { name: `T${i}`, base: 'sombre', colors: colorsForTheme('sombre') });
    expect(list).toHaveLength(THEMES_MAX);
    expect(mergeThemes('x')).toEqual([]);
    const merged = mergeThemes([null, { id: 'a', name: 'ok', base: 'zzz', colors: { primary: 'red;}' } }, { id: 'a', name: 'dup' }]);
    expect(merged[0]!.base).toBe('sombre');
    expect(merged[0]!.colors.primary).toBe(colorsForTheme('sombre').primary);
    expect(new Set(merged.map((t) => t.id)).size).toBe(merged.length);
  });

  it('round-trips through storage and tolerates corruption', () => {
    const data = new Map<string, string>();
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
    const list = addTheme([], { name: 'S', base: 'ffb', colors: colorsForTheme('ffb') });
    saveThemes(list, storage);
    expect(loadThemes(storage)).toEqual(list);
    data.set(THEMES_STORAGE_KEY, '{nope');
    expect(loadThemes(storage)).toEqual([]);
  });
});
