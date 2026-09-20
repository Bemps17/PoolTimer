import type { CompetitionMode, TimerConfig } from './types';

export const CONFIG_STORAGE_KEY = 'billiardTimerConfig';

export const COMPETITION_SHOT_TIMING = {
  tempsBase: 45,
  tempsExtension: 15,
  seuilAlerte: 15,
  seuilCritique: 5,
} as const;

export const FFB_AFTER_BREAK_DEFAULT = 90;

export const FFB_BLACKBALL_PRESET = {
  ...COMPETITION_SHOT_TIMING,
  tempsApresCasse: FFB_AFTER_BREAK_DEFAULT,
  theme: 'ffb' as const,
};

export const FBEP_ULTIMATE_PRESET = {
  ...COMPETITION_SHOT_TIMING,
  tempsApresCasse: COMPETITION_SHOT_TIMING.tempsBase,
  theme: 'fbep' as const,
};

/** Tournois / championnats FFB TD-TN. */
export const FFB_TD_TN_PRESET = {
  tempsBase: 45,
  tempsApresCasse: 90,
  tempsExtension: 45,
  seuilAlerte: 20,
  seuilCritique: 5,
  theme: 'ffb' as const,
};

/** Catégorie nationale Master (shot clock 30 s). */
export const FFB_BLACKBALL_MASTER_PRESET = {
  tempsBase: 30,
  tempsApresCasse: 60,
  tempsExtension: 30,
  seuilAlerte: 10,
  seuilCritique: 5,
  theme: 'ffb' as const,
};

/** Ambiance FFB : bleu franc. */
export const FFB_AMBIANCE = '#0066CC';
/** Ambiance Ultimate FBEP : vert canard. */
export const FBEP_AMBIANCE = '#007879';

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
    autoStartOnReset: true,
    autoStartOnPlayerSelect: false,
    minionsUnlocked: false,
    minionsMode: false,
    p1Name: 'P1',
    p1Color: '#3498db',
    p2Name: 'P2',
    p2Color: '#e74c3c',
    theme: 'sombre',
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

function asTheme(value: unknown): TimerConfig['theme'] {
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

  const p1Name = typeof s.p1Name === 'string' && s.p1Name.trim() ? s.p1Name.substring(0, 5) : defaults.p1Name;
  const p2Name = typeof s.p2Name === 'string' && s.p2Name.trim() ? s.p2Name.substring(0, 5) : defaults.p2Name;

  return {
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
    p1Name,
    p1Color: typeof s.p1Color === 'string' ? s.p1Color : defaults.p1Color,
    p2Name,
    p2Color: typeof s.p2Color === 'string' ? s.p2Color : defaults.p2Color,
    theme: asTheme(s.theme),
  };
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

export function applyCompetitionPreset(config: TimerConfig, mode: CompetitionMode): TimerConfig {
  switch (mode) {
    case 'ffb':
      return { ...config, ...FFB_BLACKBALL_PRESET };
    case 'fbep':
      return { ...config, ...FBEP_ULTIMATE_PRESET };
    case 'ffbTdTn':
      return { ...config, ...FFB_TD_TN_PRESET };
    case 'ffbMaster':
      return { ...config, ...FFB_BLACKBALL_MASTER_PRESET };
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}

export function matchesCompetitionPreset(config: TimerConfig, mode: CompetitionMode): boolean {
  const applied = applyCompetitionPreset(config, mode);
  return (
    applied.tempsBase === config.tempsBase &&
    applied.tempsApresCasse === config.tempsApresCasse &&
    applied.tempsExtension === config.tempsExtension &&
    applied.seuilAlerte === config.seuilAlerte &&
    applied.seuilCritique === config.seuilCritique &&
    applied.theme === config.theme
  );
}

/** Ultimate FBEP has no post-break extra time; other modes keep the control when the duration differs. */
export function showsApresCasseControl(config: TimerConfig): boolean {
  if (config.theme === 'fbep') return false;
  return config.tempsApresCasse !== config.tempsBase;
}

export function applyFfbPreset(config: TimerConfig): TimerConfig {
  return applyCompetitionPreset(config, 'ffb');
}
