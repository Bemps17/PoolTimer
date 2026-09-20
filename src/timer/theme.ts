import type { CompetitionMode, Theme, ThemeColors } from './types';

export const FFB_AMBIANCE = '#0066CC';
export const FBEP_AMBIANCE = '#007879';

export const THEME_COLOR_KEYS = [
  'background',
  'bezel',
  'screen',
  'buttonBg',
  'textPrimary',
  'textSecondary',
  'border',
  'primary',
  'play',
  'digitDefault',
  'digitWarning',
  'digitCritical',
  'extAvailable',
  'extUsed',
  'panelBg',
  'panelHeaderBorder',
  'panelInputBg',
  'panelInputBorder',
  'panelTextPrimary',
  'panelTextSecondary',
  'ambiance',
  'playerChipBg',
  'controlFooter',
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];
export type ThemeColorGroup = 'tableau' | 'chrono' | 'commandes' | 'reglages';

export interface ThemeColorZone {
  key: ThemeColorKey;
  cssVar: `--${string}`;
  label: string;
  group: ThemeColorGroup;
}

export const THEME_COLOR_GROUP_LABELS: Record<ThemeColorGroup, string> = {
  tableau: 'Tableau',
  chrono: 'Chronomètre',
  commandes: 'Commandes & joueurs',
  reglages: 'Menu réglages',
};

export const THEME_COLOR_ZONES: ThemeColorZone[] = [
  { key: 'background', cssVar: '--c-background', label: "Fond de l'application", group: 'tableau' },
  { key: 'bezel', cssVar: '--c-bezel', label: 'Cadre du tableau', group: 'tableau' },
  { key: 'ambiance', cssVar: '--c-ambiance', label: 'Ambiance / halo', group: 'tableau' },
  { key: 'border', cssVar: '--c-border', label: 'Bordures', group: 'tableau' },
  { key: 'textPrimary', cssVar: '--c-text-primary', label: 'Texte principal', group: 'tableau' },
  { key: 'textSecondary', cssVar: '--c-text-secondary', label: 'Texte secondaire', group: 'tableau' },
  { key: 'screen', cssVar: '--c-screen', label: 'Zone du chrono', group: 'chrono' },
  { key: 'digitDefault', cssVar: '--c-digit-default', label: 'Chiffres (normal)', group: 'chrono' },
  { key: 'digitWarning', cssVar: '--c-digit-warning', label: 'Chiffres (alerte)', group: 'chrono' },
  { key: 'digitCritical', cssVar: '--c-digit-critical', label: 'Chiffres (critique)', group: 'chrono' },
  { key: 'primary', cssVar: '--c-primary', label: 'Accent', group: 'commandes' },
  { key: 'play', cssVar: '--c-play', label: 'Bouton lecture', group: 'commandes' },
  { key: 'buttonBg', cssVar: '--c-button-bg', label: 'Fond des boutons', group: 'commandes' },
  { key: 'controlFooter', cssVar: '--c-control-footer', label: 'Pied de page', group: 'commandes' },
  { key: 'playerChipBg', cssVar: '--c-player-chip-bg', label: 'Fond zones joueurs', group: 'commandes' },
  { key: 'extAvailable', cssVar: '--c-ext-available', label: 'Extension disponible', group: 'commandes' },
  { key: 'extUsed', cssVar: '--c-ext-used', label: 'Extension utilisée', group: 'commandes' },
  { key: 'panelBg', cssVar: '--c-panel-bg', label: 'Fond des réglages', group: 'reglages' },
  { key: 'panelHeaderBorder', cssVar: '--c-panel-header-border', label: 'Filets réglages', group: 'reglages' },
  { key: 'panelInputBg', cssVar: '--c-panel-input-bg', label: 'Fond des champs', group: 'reglages' },
  { key: 'panelInputBorder', cssVar: '--c-panel-input-border', label: 'Bordure des champs', group: 'reglages' },
  { key: 'panelTextPrimary', cssVar: '--c-panel-text-primary', label: 'Texte des réglages', group: 'reglages' },
  { key: 'panelTextSecondary', cssVar: '--c-panel-text-secondary', label: 'Texte secondaire réglages', group: 'reglages' },
];

const HEX6 = /^#([0-9a-fA-F]{6})$/;
const HEX3 = /^#([0-9a-fA-F]{3})$/;

function channelToHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
}

export function parseHexRgb(value: string): { r: number; g: number; b: number } | null {
  const six = value.trim().match(HEX6);
  if (six) {
    return {
      r: Number.parseInt(six[1].slice(0, 2), 16),
      g: Number.parseInt(six[1].slice(2, 4), 16),
      b: Number.parseInt(six[1].slice(4, 6), 16),
    };
  }
  const three = value.trim().match(HEX3);
  if (three) {
    return {
      r: Number.parseInt(three[1][0] + three[1][0], 16),
      g: Number.parseInt(three[1][1] + three[1][1], 16),
      b: Number.parseInt(three[1][2] + three[1][2], 16),
    };
  }
  return null;
}

export function toHexColor(r: number, g: number, b: number): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

/** Same mix as CSS `color-mix(in srgb, fg percent%, bg)`. */
export function mixHex(foreground: string, percent: number, background: string): string {
  const fg = parseHexRgb(foreground);
  const bg = parseHexRgb(background);
  if (!fg || !bg) return foreground;
  const t = percent / 100;
  return toHexColor(fg.r * t + bg.r * (1 - t), fg.g * t + bg.g * (1 - t), fg.b * t + bg.b * (1 - t));
}

export function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const rgb = parseHexRgb(value);
  if (!rgb) return fallback;
  return toHexColor(rgb.r, rgb.g, rgb.b);
}

const SOMBRE: ThemeColors = {
  background: '#0a0a0a',
  bezel: '#1a1a1a',
  screen: '#000000',
  buttonBg: '#282828',
  textPrimary: '#e0e0e0',
  textSecondary: '#888888',
  border: '#000000',
  primary: '#3498db',
  play: '#20c20e',
  digitDefault: '#e0e0e0',
  digitWarning: '#ff8c00',
  digitCritical: '#f83333',
  extAvailable: '#2ecc71',
  extUsed: '#c0392b',
  panelBg: '#1f2128',
  panelHeaderBorder: '#333333',
  panelInputBg: '#111111',
  panelInputBorder: '#333333',
  panelTextPrimary: '#e1e3e8',
  panelTextSecondary: '#8b949e',
  ambiance: '#3498db',
  playerChipBg: '#141414',
  controlFooter: '#1a1a1a',
};

const LIGHT: ThemeColors = {
  ...SOMBRE,
  background: '#f0f0f0',
  bezel: '#dcdcdc',
  screen: '#ffffff',
  buttonBg: '#e9e9e9',
  textPrimary: '#111111',
  textSecondary: '#555555',
  border: '#aaaaaa',
  digitDefault: '#333333',
  panelBg: '#f5f5f5',
  panelHeaderBorder: '#dddddd',
  panelInputBg: '#ffffff',
  panelInputBorder: '#cccccc',
  panelTextPrimary: '#222222',
  panelTextSecondary: '#666666',
  playerChipBg: '#ffffff',
  controlFooter: '#dcdcdc',
};

const CYBERPUNK: ThemeColors = {
  ...SOMBRE,
  background: '#0d0221',
  bezel: '#240046',
  screen: '#000000',
  buttonBg: '#240046',
  primary: '#ff00e5',
  play: '#00f5d4',
  digitWarning: '#f7b801',
  digitCritical: '#ff0054',
  extAvailable: '#00f5d4',
  extUsed: '#ff0054',
  border: '#7b2cbf',
  panelBg: '#10002b',
  panelHeaderBorder: '#3c096c',
  panelInputBg: '#240046',
  panelInputBorder: '#3c096c',
  panelTextPrimary: '#f0f0f0',
  panelTextSecondary: '#a992c1',
  ambiance: '#7b2cbf',
  playerChipBg: '#10002b',
  controlFooter: '#240046',
};

function ambiancePalette(
  ambiance: string,
  extras: Pick<ThemeColors, 'screen' | 'textPrimary' | 'textSecondary' | 'digitDefault' | 'panelInputBg' | 'panelTextSecondary'>,
): ThemeColors {
  return {
    background: mixHex(ambiance, 16, '#000000'),
    bezel: mixHex(ambiance, 42, '#000000'),
    screen: extras.screen,
    buttonBg: mixHex(ambiance, 38, '#111111'),
    textPrimary: extras.textPrimary,
    textSecondary: extras.textSecondary,
    border: ambiance,
    primary: ambiance,
    play: ambiance,
    digitDefault: extras.digitDefault,
    digitWarning: SOMBRE.digitWarning,
    digitCritical: SOMBRE.digitCritical,
    extAvailable: SOMBRE.extAvailable,
    extUsed: SOMBRE.extUsed,
    panelBg: mixHex(ambiance, 28, extras.panelInputBg),
    panelHeaderBorder: ambiance,
    panelInputBg: extras.panelInputBg,
    panelInputBorder: ambiance,
    panelTextPrimary: extras.textPrimary,
    panelTextSecondary: extras.panelTextSecondary,
    ambiance,
    playerChipBg: mixHex(ambiance, 22, '#000000'),
    controlFooter: mixHex(ambiance, 42, '#000000'),
  };
}

const FFB: ThemeColors = ambiancePalette(FFB_AMBIANCE, {
  screen: '#000810',
  textPrimary: '#e8f3ff',
  textSecondary: '#7ea8cc',
  digitDefault: '#d6ecff',
  panelInputBg: '#07182c',
  panelTextSecondary: '#8fb4d4',
});

const FBEP: ThemeColors = ambiancePalette(FBEP_AMBIANCE, {
  screen: '#000d0b',
  textPrimary: '#e5faf6',
  textSecondary: '#7db8ad',
  digitDefault: '#d6fff6',
  panelInputBg: '#05241f',
  panelTextSecondary: '#8fc9bf',
});

export const NAMED_THEME_PALETTES: Record<Theme, ThemeColors> = {
  sombre: SOMBRE,
  light: LIGHT,
  cyberpunk: CYBERPUNK,
  ffb: FFB,
  fbep: FBEP,
};

export function colorsForTheme(theme: Theme): ThemeColors {
  return { ...NAMED_THEME_PALETTES[theme] };
}

export function parseThemeColors(raw: unknown, fallback: ThemeColors): ThemeColors {
  if (!raw || typeof raw !== 'object') return { ...fallback };
  const source = raw as Partial<Record<ThemeColorKey, unknown>>;
  const next = { ...fallback };
  for (const key of THEME_COLOR_KEYS) {
    next[key] = normalizeHexColor(source[key], fallback[key]);
  }
  return next;
}

export function themeColorsEqual(left: ThemeColors, right: ThemeColors): boolean {
  return THEME_COLOR_KEYS.every((key) => left[key].toLowerCase() === right[key].toLowerCase());
}

const THEME_BODY_CLASSES = ['theme-light', 'theme-cyberpunk', 'theme-ffb', 'theme-fbep'] as const;

export function themeBodyClass(theme: Theme): string {
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

export interface ThemeRoot {
  classList: {
    add(name: string): void;
    remove(name: string): void;
  };
  style: {
    setProperty(name: string, value: string): void;
  };
}

export function applyThemeToDocument(theme: Theme, colors: ThemeColors, root: ThemeRoot = document.body): void {
  for (const className of THEME_BODY_CLASSES) {
    root.classList.remove(className);
  }
  const className = themeBodyClass(theme);
  if (className) root.classList.add(className);
  for (const zone of THEME_COLOR_ZONES) {
    root.style.setProperty(zone.cssVar, colors[zone.key]);
  }
}

export function suggestedThemeForCompetition(mode: CompetitionMode): Theme {
  switch (mode) {
    case 'fbep':
      return 'fbep';
    case 'ffb':
    case 'ffbTdTn':
    case 'ffbMaster':
      return 'ffb';
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}
