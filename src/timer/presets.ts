import { COMPETITION_PRESET_TIMINGS, CONFIG_LIMITS, withSyncedCompetitionMode } from './config';
import { formatSecondsClock } from './format';
import { MATCH_LIMITS } from './match';
import type { CompetitionMode, TimerConfig } from './types';

/**
 * Presets personnalisés : chronométrage (+ course à N optionnelle).
 * L'apparence reste indépendante (décision v2.7.0) : un preset ne touche jamais aux couleurs.
 */

export type PresetTimings = Pick<
  TimerConfig,
  'tempsBase' | 'tempsApresCasse' | 'tempsExtension' | 'seuilAlerte' | 'seuilCritique'
>;

export interface CustomPreset extends PresetTimings {
  id: string;
  name: string;
  /** Course à N appliquée avec le preset (null = ne change pas le réglage du scoreur). */
  raceTo: number | null;
  createdAt: number;
}

export const PRESET_NAME_MAX = 32;
export const PRESETS_MAX = 30;

export const BUILTIN_PRESET_NAMES: Record<CompetitionMode, string> = {
  ffb: 'FFB Blackball',
  ffbTdTn: 'FFB TD/TN',
  ffbMaster: 'FFB Blackball Master',
  fbep: 'Ultimate FBEP',
};

const TIMING_KEYS: Array<keyof PresetTimings> = [
  'tempsBase',
  'tempsApresCasse',
  'tempsExtension',
  'seuilAlerte',
  'seuilCritique',
];

const TIMING_LABELS: Record<keyof PresetTimings, string> = {
  tempsBase: 'base',
  tempsApresCasse: 'après casse',
  tempsExtension: 'extension',
  seuilAlerte: 'alerte',
  seuilCritique: 'critique',
};

/** Nom affichable : sans caractères de contrôle ni balises, espaces normalisés, borné. */
export function sanitizePresetName(raw: unknown, fallback = 'Mon preset'): string {
  if (typeof raw !== 'string') return fallback;
  const cleaned = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PRESET_NAME_MAX)
    .trim();
  return cleaned || fallback;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

/** Valide un chronométrage (bornes de CONFIG_LIMITS ; le seuil critique ne dépasse jamais le seuil d'alerte). */
export function sanitizeTimings(raw: Partial<Record<keyof PresetTimings, unknown>>, fallback: PresetTimings): PresetTimings {
  const l = CONFIG_LIMITS;
  const seuilAlerte = clampInt(raw.seuilAlerte, fallback.seuilAlerte, l.seuilAlerte.min, l.seuilAlerte.max);
  const seuilCritique = Math.min(
    seuilAlerte,
    clampInt(raw.seuilCritique, fallback.seuilCritique, l.seuilCritique.min, l.seuilCritique.max),
  );
  return {
    tempsBase: clampInt(raw.tempsBase, fallback.tempsBase, l.tempsBase.min, l.tempsBase.max),
    tempsApresCasse: clampInt(raw.tempsApresCasse, fallback.tempsApresCasse, l.tempsApresCasse.min, l.tempsApresCasse.max),
    tempsExtension: clampInt(raw.tempsExtension, fallback.tempsExtension, l.tempsExtension.min, l.tempsExtension.max),
    seuilAlerte,
    seuilCritique,
  };
}

export function newPresetId(random: () => number = Math.random, now: () => number = Date.now): string {
  return `p-${now().toString(36)}-${Math.floor(random() * 0xffffff)
    .toString(36)
    .padStart(4, '0')}`;
}

function uniqueId(existing: readonly CustomPreset[], random?: () => number, now?: () => number): string {
  let id = newPresetId(random, now);
  let guard = 0;
  while (existing.some((p) => p.id === id) && guard < 20) {
    id = `${newPresetId(random, now)}${guard}`;
    guard += 1;
  }
  return id;
}

export function timingsOf(config: PresetTimings): PresetTimings {
  return {
    tempsBase: config.tempsBase,
    tempsApresCasse: config.tempsApresCasse,
    tempsExtension: config.tempsExtension,
    seuilAlerte: config.seuilAlerte,
    seuilCritique: config.seuilCritique,
  };
}

export function builtinTimings(mode: CompetitionMode): PresetTimings {
  return timingsOf(COMPETITION_PRESET_TIMINGS[mode]);
}

/** Crée un preset (ajouté en fin de liste). Retourne la liste inchangée au-delà de PRESETS_MAX. */
export function addPreset(
  presets: readonly CustomPreset[],
  input: { name: string; timings: PresetTimings; raceTo?: number | null },
  deps: { random?: () => number; now?: () => number } = {},
): CustomPreset[] {
  if (presets.length >= PRESETS_MAX) return [...presets];
  const now = deps.now ?? Date.now;
  const preset: CustomPreset = {
    id: uniqueId(presets, deps.random, now),
    name: sanitizePresetName(input.name),
    ...sanitizeTimings(input.timings, input.timings),
    raceTo:
      input.raceTo == null ? null : clampInt(input.raceTo, 0, MATCH_LIMITS.targetScore.min, MATCH_LIMITS.targetScore.max),
    createdAt: now(),
  };
  return [...presets, preset];
}

export function renamePreset(presets: readonly CustomPreset[], id: string, name: string): CustomPreset[] {
  return presets.map((p) => (p.id === id ? { ...p, name: sanitizePresetName(name, p.name) } : p));
}

export function removePreset(presets: readonly CustomPreset[], id: string): CustomPreset[] {
  return presets.filter((p) => p.id !== id);
}

export function duplicatePreset(
  presets: readonly CustomPreset[],
  id: string,
  deps: { random?: () => number; now?: () => number } = {},
): CustomPreset[] {
  const source = presets.find((p) => p.id === id);
  if (!source) return [...presets];
  return addPreset(
    presets,
    { name: sanitizePresetName(`${source.name} (copie)`, source.name), timings: source, raceTo: source.raceTo },
    deps,
  );
}

/** Valide la liste lue du stockage (ou, plus tard, d'un import). Jamais de confiance au JSON entrant. */
export function mergePresets(raw: unknown): CustomPreset[] {
  if (!Array.isArray(raw)) return [];
  const fallback = builtinTimings('ffb');
  const seen = new Set<string>();
  const out: CustomPreset[] = [];
  for (const entry of raw) {
    if (out.length >= PRESETS_MAX) break;
    if (!entry || typeof entry !== 'object') continue;
    const value = entry as Partial<Record<keyof CustomPreset, unknown>>;
    let id = typeof value.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(value.id) ? value.id : '';
    if (!id || seen.has(id)) id = uniqueId(out);
    seen.add(id);
    const createdAt = typeof value.createdAt === 'number' && Number.isFinite(value.createdAt) ? value.createdAt : 0;
    out.push({
      id,
      name: sanitizePresetName(value.name),
      ...sanitizeTimings(value as Partial<Record<keyof PresetTimings, unknown>>, fallback),
      raceTo:
        value.raceTo == null
          ? null
          : clampInt(value.raceTo, 0, MATCH_LIMITS.targetScore.min, MATCH_LIMITS.targetScore.max),
      createdAt,
    });
  }
  return out;
}

export function timingsEqual(a: PresetTimings, b: PresetTimings): boolean {
  return TIMING_KEYS.every((key) => a[key] === b[key]);
}

export function matchesPreset(config: PresetTimings, preset: PresetTimings): boolean {
  return timingsEqual(timingsOf(config), timingsOf(preset));
}

/** « 45s · 1:30 · +15s » (après casse omise si identique à la base). */
export function describeTimings(t: PresetTimings): string {
  const parts = [formatSecondsClock(t.tempsBase)];
  if (t.tempsApresCasse !== t.tempsBase) parts.push(formatSecondsClock(t.tempsApresCasse));
  parts.push(`+${formatSecondsClock(t.tempsExtension)}`);
  return parts.join(' · ');
}

/** Aperçu avant application : « base 45→30 s · extension 15→30 s » (vide si rien ne change). */
function timingChanges(current: PresetTimings, next: PresetTimings): string[] {
  return TIMING_KEYS.filter((key) => current[key] !== next[key]).map(
    (key) => `${TIMING_LABELS[key]} ${current[key]}→${next[key]} s`,
  );
}

export function diffTimings(current: PresetTimings, next: PresetTimings): string {
  return timingChanges(current, next).join(' · ');
}

/** Version courte pour un toast : les `max` premiers changements, puis « + n autres ». */
export function summarizeTimingChanges(current: PresetTimings, next: PresetTimings, max = 2): string {
  const changes = timingChanges(current, next);
  if (changes.length <= max) return changes.join(' · ');
  const rest = changes.length - max;
  return `${changes.slice(0, max).join(' · ')} + ${rest} ${rest > 1 ? 'autres' : 'autre'}`;
}

/** Applique un preset : chronométrage (+ course à N). Apparence et sons intacts. */
export function applyPreset(config: TimerConfig, preset: CustomPreset): TimerConfig {
  return withSyncedCompetitionMode({
    ...config,
    ...timingsOf(preset),
    matchOptions:
      preset.raceTo === null ? config.matchOptions : { ...config.matchOptions, targetScore: preset.raceTo },
  });
}
