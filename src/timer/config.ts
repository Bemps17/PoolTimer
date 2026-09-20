import { defaultIdsForPack, isAlertPackId, isAlertPickMode, isCriticalAlertStyle, sanitizeSoundIdList } from '../audio/soundCatalog';
import { readStoredPlayerName } from './playerName';
import {
  colorsForTheme,
  FBEP_AMBIANCE,
  FFB_AMBIANCE,
  parseThemeColors,
  suggestedThemeForCompetition,
} from './theme';
import type { CompetitionMode, Theme, TimerConfig } from './types';

export { FBEP_AMBIANCE, FFB_AMBIANCE };

export const CONFIG_STORAGE_KEY = 'billiardTimerConfig';

export const COMPETITION_SHOT_TIMING = {
  tempsBase: 45,
  tempsExtension: 15,
  seuilAlerte: 15,
  seuilCritique: 5,
} as const;

export const FFB_AFTER_BREAK_DEFAULT = 90;

/** Timing-only presets. Appearance is applied separately as a one-time suggestion. */
export const FFB_BLACKBALL_PRESET = {
  ...COMPETITION_SHOT_TIMING,
  tempsApresCasse: FFB_AFTER_BREAK_DEFAULT,
};

export const FBEP_ULTIMATE_PRESET = {
  ...COMPETITION_SHOT_TIMING,
  tempsApresCasse: COMPETITION_SHOT_TIMING.tempsBase,
};

/** Tournois / championnats FFB TD-TN. */
export const FFB_TD_TN_PRESET = {
  tempsBase: 45,
  tempsApresCasse: 90,
  tempsExtension: 45,
  seuilAlerte: 20,
  seuilCritique: 5,
};

/** Catégorie nationale Master (shot clock 30 s). */
export const FFB_BLACKBALL_MASTER_PRESET = {
  tempsBase: 30,
  tempsApresCasse: 60,
  tempsExtension: 30,
  seuilAlerte: 10,
  seuilCritique: 5,
};

export const COMPETITION_PRESET_TIMINGS: Record<
  CompetitionMode,
  Pick<TimerConfig, 'tempsBase' | 'tempsApresCasse' | 'tempsExtension' | 'seuilAlerte' | 'seuilCritique'>
> = {
  ffb: FFB_BLACKBALL_PRESET,
  fbep: FBEP_ULTIMATE_PRESET,
  ffbTdTn: FFB_TD_TN_PRESET,
  ffbMaster: FFB_BLACKBALL_MASTER_PRESET,
};

export const COMPETITION_MODES: CompetitionMode[] = ['ffb', 'fbep', 'ffbTdTn', 'ffbMaster'];

export const CONFIG_LIMITS = {
  tempsBase: { min: 10, max: 180 },
  tempsApresCasse: { min: 10, max: 180 },
  tempsExtension: { min: 5, max: 90 },
  seuilAlerte: { min: 1, max: 179 },
  seuilCritique: { min: 1, max: 179 },
  tailleChiffres: { min: 60, max: 140 },
} as const;

/** Baseline plus grande que l’ancien ratio 0.55 de la largeur d’écran. */
export const TIMER_DIGIT_WIDTH_RATIO = 0.75;
export const TIMER_DIGIT_HEIGHT_RATIO = 0.95;

export function computeTimerFontSize(
  screenWidth: number,
  screenHeight: number,
  tailleChiffres: number,
): number {
  const scale =
    clampInt(
      tailleChiffres,
      100,
      CONFIG_LIMITS.tailleChiffres.min,
      CONFIG_LIMITS.tailleChiffres.max,
    ) / 100;
  const widthBased = Math.max(0, screenWidth) * TIMER_DIGIT_WIDTH_RATIO * scale;
  const heightBased = Math.max(0, screenHeight) * TIMER_DIGIT_HEIGHT_RATIO;
  return Math.min(widthBased, heightBased);
}

export function getDefaultConfig(): TimerConfig {
  return {
    tempsBase: COMPETITION_SHOT_TIMING.tempsBase,
    tempsApresCasse: FFB_AFTER_BREAK_DEFAULT,
    tempsExtension: COMPETITION_SHOT_TIMING.tempsExtension,
    seuilAlerte: COMPETITION_SHOT_TIMING.seuilAlerte,
    seuilCritique: COMPETITION_SHOT_TIMING.seuilCritique,
    volume: -10,
    sonAlertes: true,
    sonClics: true,
    vibration: true,
    affichageMs: true,
    modeInterface: 'boutons',
    tailleChiffres: 100,
    autoStartOnReset: false,
    autoStartOnPlayerSelect: false,
    minionsUnlocked: false,
    minionsMode: false,
    alertPack: 'classic',
    alertPickMode: 'fixed',
    alertWarningIds: defaultIdsForPack('classic').warning,
    alertCriticalIds: defaultIdsForPack('classic').critical,
    alertEndIds: defaultIdsForPack('classic').end,
    criticalAlertStyle: 'repeat',
    p1Name: 'P1',
    p1Color: '#3498db',
    p2Name: 'P2',
    p2Color: '#e74c3c',
    theme: 'sombre',
    colors: colorsForTheme('sombre'),
    competitionMode: 'ffb',
  };
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function asTheme(value: unknown): Theme {
  switch (value) {
    case 'sombre':
    case 'light':
    case 'cyberpunk':
    case 'ffb':
    case 'fbep':
      return value;
    default:
      return 'sombre';
  }
}

function asCompetitionMode(value: unknown): CompetitionMode | null {
  switch (value) {
    case 'ffb':
    case 'fbep':
    case 'ffbTdTn':
    case 'ffbMaster':
      return value;
    default:
      return null;
  }
}

function timingsEqual(
  config: Pick<TimerConfig, 'tempsBase' | 'tempsApresCasse' | 'tempsExtension' | 'seuilAlerte' | 'seuilCritique'>,
  timings: Pick<TimerConfig, 'tempsBase' | 'tempsApresCasse' | 'tempsExtension' | 'seuilAlerte' | 'seuilCritique'>,
): boolean {
  return (
    timings.tempsBase === config.tempsBase &&
    timings.tempsApresCasse === config.tempsApresCasse &&
    timings.tempsExtension === config.tempsExtension &&
    timings.seuilAlerte === config.seuilAlerte &&
    timings.seuilCritique === config.seuilCritique
  );
}

export function detectCompetitionMode(
  config: Pick<TimerConfig, 'tempsBase' | 'tempsApresCasse' | 'tempsExtension' | 'seuilAlerte' | 'seuilCritique'>,
): CompetitionMode | null {
  for (const mode of COMPETITION_MODES) {
    if (timingsEqual(config, COMPETITION_PRESET_TIMINGS[mode])) return mode;
  }
  return null;
}

export function withSyncedCompetitionMode(config: TimerConfig): TimerConfig {
  return { ...config, competitionMode: detectCompetitionMode(config) };
}

function asInterfaceMode(value: unknown): TimerConfig['modeInterface'] {
  switch (value) {
    case 'boutons':
    case 'tactile':
      return value;
    default:
      return 'boutons';
  }
}

export function mergeConfig(saved: unknown): TimerConfig {
  const defaults = getDefaultConfig();
  if (!saved || typeof saved !== 'object') return defaults;
  const s = saved as Partial<TimerConfig>;

  const p1Name = readStoredPlayerName(s.p1Name, defaults.p1Name);
  const p2Name = readStoredPlayerName(s.p2Name, defaults.p2Name);
  const alertPack = isAlertPackId(s.alertPack) ? s.alertPack : defaults.alertPack;
  const criticalAlertStyle = isCriticalAlertStyle(s.criticalAlertStyle)
    ? s.criticalAlertStyle
    : defaults.criticalAlertStyle;
  const packDefaults = defaultIdsForPack(alertPack, criticalAlertStyle);

  const merged: TimerConfig = {
    tempsBase: clampInt(s.tempsBase, defaults.tempsBase, CONFIG_LIMITS.tempsBase.min, CONFIG_LIMITS.tempsBase.max),
    tempsApresCasse: clampInt(
      s.tempsApresCasse,
      defaults.tempsApresCasse,
      CONFIG_LIMITS.tempsApresCasse.min,
      CONFIG_LIMITS.tempsApresCasse.max,
    ),
    tempsExtension: clampInt(
      s.tempsExtension,
      defaults.tempsExtension,
      CONFIG_LIMITS.tempsExtension.min,
      CONFIG_LIMITS.tempsExtension.max,
    ),
    seuilAlerte: clampInt(s.seuilAlerte, defaults.seuilAlerte, CONFIG_LIMITS.seuilAlerte.min, CONFIG_LIMITS.seuilAlerte.max),
    seuilCritique: clampInt(
      s.seuilCritique,
      defaults.seuilCritique,
      CONFIG_LIMITS.seuilCritique.min,
      CONFIG_LIMITS.seuilCritique.max,
    ),
    volume: typeof s.volume === 'number' && Number.isFinite(s.volume) ? s.volume : defaults.volume,
    sonAlertes: asBoolean(s.sonAlertes, defaults.sonAlertes),
    sonClics: asBoolean(s.sonClics, defaults.sonClics),
    vibration: asBoolean(s.vibration, defaults.vibration),
    affichageMs: asBoolean(s.affichageMs, defaults.affichageMs),
    modeInterface: asInterfaceMode(s.modeInterface),
    tailleChiffres: clampInt(
      s.tailleChiffres,
      defaults.tailleChiffres,
      CONFIG_LIMITS.tailleChiffres.min,
      CONFIG_LIMITS.tailleChiffres.max,
    ),
    autoStartOnReset: asBoolean(s.autoStartOnReset, defaults.autoStartOnReset),
    autoStartOnPlayerSelect: asBoolean(s.autoStartOnPlayerSelect, defaults.autoStartOnPlayerSelect),
    minionsUnlocked:
      asBoolean(s.minionsUnlocked, defaults.minionsUnlocked) || asBoolean(s.minionsMode, defaults.minionsMode),
    minionsMode: asBoolean(s.minionsMode, defaults.minionsMode),
    alertPack,
    alertPickMode: isAlertPickMode(s.alertPickMode) ? s.alertPickMode : defaults.alertPickMode,
    alertWarningIds: sanitizeSoundIdList(s.alertWarningIds, packDefaults.warning),
    alertCriticalIds: sanitizeSoundIdList(s.alertCriticalIds, packDefaults.critical),
    alertEndIds: sanitizeSoundIdList(s.alertEndIds, packDefaults.end),
    criticalAlertStyle,
    p1Name,
    p1Color: typeof s.p1Color === 'string' ? s.p1Color : defaults.p1Color,
    p2Name,
    p2Color: typeof s.p2Color === 'string' ? s.p2Color : defaults.p2Color,
    theme: asTheme(s.theme),
    colors: parseThemeColors(s.colors, colorsForTheme(asTheme(s.theme))),
    competitionMode: asCompetitionMode(s.competitionMode),
  };
  return withSyncedCompetitionMode(merged);
}

export function loadConfig(): TimerConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    return raw ? mergeConfig(JSON.parse(raw)) : getDefaultConfig();
  } catch {
    return getDefaultConfig();
  }
}

export function saveConfig(config: TimerConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save config to localStorage', error);
  }
}

export function applyNamedTheme(config: TimerConfig, theme: Theme): TimerConfig {
  return { ...config, theme, colors: colorsForTheme(theme) };
}

export function applyCompetitionPreset(
  config: TimerConfig,
  mode: CompetitionMode,
  options?: { suggestTheme?: boolean },
): TimerConfig {
  const timings = COMPETITION_PRESET_TIMINGS[mode];
  const next: TimerConfig = {
    ...config,
    ...timings,
    competitionMode: mode,
  };
  if (options?.suggestTheme === false) return next;
  return applyNamedTheme(next, suggestedThemeForCompetition(mode));
}

export function matchesCompetitionPreset(config: TimerConfig, mode: CompetitionMode): boolean {
  return timingsEqual(config, COMPETITION_PRESET_TIMINGS[mode]);
}

/** Ultimate FBEP has no post-break extra time; other modes keep the control when the duration differs. */
export function showsApresCasseControl(config: TimerConfig): boolean {
  if (config.competitionMode === 'fbep' || matchesCompetitionPreset(config, 'fbep')) return false;
  return config.tempsApresCasse !== config.tempsBase;
}

export function applyFfbPreset(config: TimerConfig): TimerConfig {
  return applyCompetitionPreset(config, 'ffb');
}
