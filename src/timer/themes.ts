import { newPresetId, sanitizePresetName } from './presets';
import { colorsForTheme, parseThemeColors, themeColorsEqual } from './theme';
import type { Theme, ThemeColors, TimerConfig } from './types';

/** Thèmes personnalisés nommés (apparence uniquement : aucun lien avec les presets de chronométrage). */
export interface CustomTheme {
  id: string;
  name: string;
  /** Thème nommé de départ (classes CSS : clair / cyberpunk / …). */
  base: Theme;
  colors: ThemeColors;
  createdAt: number;
}

export const THEMES_MAX = 20;
const THEME_IDS: Theme[] = ['sombre', 'light', 'cyberpunk', 'ffb', 'fbep'];

export function asBaseTheme(value: unknown): Theme {
  return typeof value === 'string' && (THEME_IDS as string[]).includes(value) ? (value as Theme) : 'sombre';
}

export function addTheme(
  themes: readonly CustomTheme[],
  input: { name: string; base: Theme; colors: ThemeColors },
  deps: { random?: () => number; now?: () => number } = {},
): CustomTheme[] {
  if (themes.length >= THEMES_MAX) return [...themes];
  const now = deps.now ?? Date.now;
  let id = newPresetId(deps.random, now);
  let guard = 0;
  while (themes.some((t) => t.id === id) && guard < 20) {
    id = `${newPresetId(deps.random, now)}${guard}`;
    guard += 1;
  }
  const base = asBaseTheme(input.base);
  return [
    ...themes,
    {
      id,
      name: sanitizePresetName(input.name, 'Mon thème'),
      base,
      colors: parseThemeColors(input.colors, colorsForTheme(base)),
      createdAt: now(),
    },
  ];
}

export function renameTheme(themes: readonly CustomTheme[], id: string, name: string): CustomTheme[] {
  return themes.map((t) => (t.id === id ? { ...t, name: sanitizePresetName(name, t.name) } : t));
}

export function removeTheme(themes: readonly CustomTheme[], id: string): CustomTheme[] {
  return themes.filter((t) => t.id !== id);
}

export function mergeThemes(raw: unknown): CustomTheme[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: CustomTheme[] = [];
  for (const entry of raw) {
    if (out.length >= THEMES_MAX) break;
    if (!entry || typeof entry !== 'object') continue;
    const value = entry as Partial<Record<keyof CustomTheme, unknown>>;
    let id = typeof value.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(value.id) ? value.id : '';
    if (!id || seen.has(id)) id = newPresetId();
    seen.add(id);
    const base = asBaseTheme(value.base);
    out.push({
      id,
      name: sanitizePresetName(value.name, 'Mon thème'),
      base,
      colors: parseThemeColors(value.colors, colorsForTheme(base)),
      createdAt: typeof value.createdAt === 'number' && Number.isFinite(value.createdAt) ? value.createdAt : 0,
    });
  }
  return out;
}

export function applyCustomTheme(config: TimerConfig, theme: Pick<CustomTheme, 'base' | 'colors'>): TimerConfig {
  return { ...config, theme: theme.base, colors: { ...theme.colors } };
}

export function matchesTheme(config: Pick<TimerConfig, 'theme' | 'colors'>, theme: Pick<CustomTheme, 'base' | 'colors'>): boolean {
  return config.theme === theme.base && themeColorsEqual(config.colors, theme.colors);
}

export const THEMES_STORAGE_KEY = 'h8timer.themes';

export function loadThemes(
  storage: Pick<Storage, 'getItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): CustomTheme[] {
  try {
    const raw = storage?.getItem(THEMES_STORAGE_KEY);
    return raw ? mergeThemes(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveThemes(
  themes: readonly CustomTheme[],
  storage: Pick<Storage, 'setItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): void {
  try {
    storage?.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
  } catch {
    // quota / mode privé
  }
}
