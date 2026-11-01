import { sanitizeTimings, sanitizePresetName, builtinTimings, type PresetTimings } from '../timer/presets';
import { MATCH_LIMITS } from '../timer/match';
import { asBaseTheme } from '../timer/themes';
import { colorsForTheme, parseThemeColors, THEME_COLOR_KEYS } from '../timer/theme';
import type { Theme, ThemeColors } from '../timer/types';

/**
 * Enveloppe d'échange versionnée : un preset, un thème ou les deux (« bundle »).
 * Tout ce qui entre (lien, fichier, texte collé) est traité comme hostile : taille bornée, clés connues
 * uniquement, valeurs clampées. Rien n'est appliqué sans confirmation de l'utilisateur.
 */

export const ENVELOPE_VERSION = 1;
export const MAX_PAYLOAD_CHARS = 6000;
export const MAX_FILE_BYTES = 16 * 1024;
export const SHARE_HASH_KEY = 'h8';

export type ShareKind = 'preset' | 'theme' | 'bundle';

export interface SharedPreset extends PresetTimings {
  name: string;
  raceTo: number | null;
}

export interface SharedTheme {
  name: string;
  base: Theme;
  colors: ThemeColors;
}

export interface ShareEnvelope {
  kind: ShareKind;
  preset?: SharedPreset;
  theme?: SharedTheme;
}

export type ParseResult = { ok: true; envelope: ShareEnvelope } | { ok: false; error: string };

/** Ne transmet que les couleurs qui diffèrent du thème de base : lien et QR bien plus courts. */
function compactTheme(theme: SharedTheme): Record<string, unknown> {
  const base = colorsForTheme(theme.base);
  const colors: Record<string, string> = {};
  for (const key of THEME_COLOR_KEYS) {
    if (theme.colors[key].toLowerCase() !== base[key].toLowerCase()) colors[key] = theme.colors[key];
  }
  return { name: theme.name, base: theme.base, colors };
}

export function toWire(envelope: ShareEnvelope): Record<string, unknown> {
  return {
    h8: ENVELOPE_VERSION,
    kind: envelope.kind,
    ...(envelope.preset ? { preset: envelope.preset } : {}),
    ...(envelope.theme ? { theme: compactTheme(envelope.theme) } : {}),
  };
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(payload: string): string | null {
  try {
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function encodeEnvelope(envelope: ShareEnvelope): string {
  return toBase64Url(JSON.stringify(toWire(envelope)));
}

export function buildShareUrl(origin: string, envelope: ShareEnvelope): string {
  return `${origin.replace(/\/$/, '')}/#${SHARE_HASH_KEY}=${encodeEnvelope(envelope)}`;
}

export function envelopeToFileText(envelope: ShareEnvelope): string {
  return JSON.stringify(toWire(envelope), null, 2);
}

export function shareFileName(envelope: ShareEnvelope): string {
  const name = envelope.preset?.name ?? envelope.theme?.name ?? 'h8timer';
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${slug || 'h8timer'}.h8preset.json`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function parsePreset(raw: unknown): SharedPreset | null {
  const value = asRecord(raw);
  if (!value) return null;
  const raceRaw = value.raceTo;
  const raceTo =
    typeof raceRaw === 'number' && Number.isFinite(raceRaw)
      ? Math.min(MATCH_LIMITS.targetScore.max, Math.max(MATCH_LIMITS.targetScore.min, Math.round(raceRaw)))
      : null;
  return {
    name: sanitizePresetName(value.name),
    ...sanitizeTimings(value as Partial<Record<keyof PresetTimings, unknown>>, builtinTimings('ffb')),
    raceTo,
  };
}

function parseTheme(raw: unknown): SharedTheme | null {
  const value = asRecord(raw);
  if (!value) return null;
  const base = asBaseTheme(value.base);
  return {
    name: sanitizePresetName(value.name, 'Thème partagé'),
    base,
    colors: parseThemeColors(value.colors, colorsForTheme(base)),
  };
}

export function parseEnvelope(raw: unknown): ParseResult {
  const value = asRecord(raw);
  if (!value) return { ok: false, error: 'Contenu illisible.' };
  if (value.h8 !== ENVELOPE_VERSION) {
    return {
      ok: false,
      error:
        typeof value.h8 === 'number' && value.h8 > ENVELOPE_VERSION
          ? 'Ce partage vient d’une version plus récente de H8timer. Mettez l’application à jour.'
          : 'Ce n’est pas un partage H8timer.',
    };
  }
  const kind = value.kind;
  if (kind !== 'preset' && kind !== 'theme' && kind !== 'bundle') return { ok: false, error: 'Type de partage inconnu.' };
  const preset = kind === 'theme' ? null : parsePreset(value.preset);
  const theme = kind === 'preset' ? null : parseTheme(value.theme);
  if ((kind !== 'theme' && !preset) || (kind !== 'preset' && !theme)) {
    return { ok: false, error: 'Partage incomplet ou invalide.' };
  }
  return { ok: true, envelope: { kind, ...(preset ? { preset } : {}), ...(theme ? { theme } : {}) } };
}

/** Accepte : lien complet, « #h8=… », « h8=… », charge utile seule, ou JSON collé. */
export function decodeShareText(text: string): ParseResult {
  const input = text.trim();
  if (!input) return { ok: false, error: 'Rien à importer.' };
  if (input.length > MAX_PAYLOAD_CHARS) return { ok: false, error: 'Contenu trop volumineux.' };

  if (input.startsWith('{')) {
    try {
      return parseEnvelope(JSON.parse(input));
    } catch {
      return { ok: false, error: 'JSON invalide.' };
    }
  }

  const match = input.match(new RegExp(`(?:[#&?]|^)${SHARE_HASH_KEY}=([A-Za-z0-9_-]+)`));
  const payload = match ? match[1]! : /^[A-Za-z0-9_-]+$/.test(input) ? input : '';
  if (!payload) return { ok: false, error: 'Lien ou code non reconnu.' };
  const json = fromBase64Url(payload);
  if (json === null) return { ok: false, error: 'Code corrompu.' };
  try {
    return parseEnvelope(JSON.parse(json));
  } catch {
    return { ok: false, error: 'Code corrompu.' };
  }
}

/** Lit un fichier .json (taille bornée). */
export async function readShareFile(file: Pick<File, 'size' | 'text'>): Promise<ParseResult> {
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'Fichier trop volumineux.' };
  return decodeShareText(await file.text());
}
