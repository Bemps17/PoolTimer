import { isValidRoomCode, normalizeRoomCode } from './protocol';

/**
 * Overlay de streaming (OBS Studio, Streamlabs, vMix…) : une URL « Source navigateur » en lecture seule,
 * fond transparent, qui se branche sur la salle miroir existante (aucun changement de relais nécessaire).
 */

export type OverlayParts = 'both' | 'timer' | 'score';
export type OverlayLayout = 'row' | 'column';
export type OverlayBackground = 'transparent' | 'dark' | 'chroma';

export interface OverlayOptions {
  parts: OverlayParts;
  layout: OverlayLayout;
  showNames: boolean;
  showFerme: boolean;
  showBreaker: boolean;
  /** Part de la zone occupée par les chiffres du chrono, en %. */
  scale: number;
  background: OverlayBackground;
}

export const OVERLAY_SCALE = { min: 40, max: 100 } as const;
export const OVERLAY_STORAGE_KEY = 'h8timer.overlay';

export const OVERLAY_PARTS: OverlayParts[] = ['both', 'timer', 'score'];
export const OVERLAY_LAYOUTS: OverlayLayout[] = ['row', 'column'];
export const OVERLAY_BACKGROUNDS: OverlayBackground[] = ['transparent', 'dark', 'chroma'];

export function getDefaultOverlayOptions(): OverlayOptions {
  return {
    parts: 'both',
    layout: 'row',
    showNames: true,
    showFerme: true,
    showBreaker: true,
    scale: 100,
    background: 'transparent',
  };
}

function oneOf<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return typeof value === 'string' && (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

function flag(value: unknown, fallback: boolean): boolean {
  if (value === '1' || value === true) return true;
  if (value === '0' || value === false) return false;
  return fallback;
}

export function sanitizeOverlayOptions(raw: Partial<Record<keyof OverlayOptions, unknown>>): OverlayOptions {
  const d = getDefaultOverlayOptions();
  const scale = typeof raw.scale === 'number' ? raw.scale : Number.parseInt(String(raw.scale ?? ''), 10);
  return {
    parts: oneOf(OVERLAY_PARTS, raw.parts, d.parts),
    layout: oneOf(OVERLAY_LAYOUTS, raw.layout, d.layout),
    showNames: flag(raw.showNames, d.showNames),
    showFerme: flag(raw.showFerme, d.showFerme),
    showBreaker: flag(raw.showBreaker, d.showBreaker),
    scale: Number.isFinite(scale) ? Math.min(OVERLAY_SCALE.max, Math.max(OVERLAY_SCALE.min, Math.round(scale))) : d.scale,
    background: oneOf(OVERLAY_BACKGROUNDS, raw.background, d.background),
  };
}

export function overlayPath(room: string): string {
  return `/o/${normalizeRoomCode(room)}`;
}

/** Route `/o/CODE`. */
export function parseOverlayRoom(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  const match = path.match(/^\/o\/([A-Za-z0-9]{4,8})$/i);
  if (!match) return null;
  const code = normalizeRoomCode(match[1]);
  return isValidRoomCode(code) ? code : null;
}

export function parseOverlayOptions(search: string): OverlayOptions {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return sanitizeOverlayOptions({
    parts: params.get('p') ?? undefined,
    layout: params.get('l') ?? undefined,
    showNames: params.get('n') ?? undefined,
    showFerme: params.get('f') ?? undefined,
    showBreaker: params.get('b') ?? undefined,
    scale: params.get('s') ?? undefined,
    background: params.get('bg') ?? undefined,
  });
}

/** URL à coller dans la source navigateur. Seules les valeurs non par défaut sont écrites. */
export function overlayUrl(origin: string, room: string, options: OverlayOptions): string {
  const d = getDefaultOverlayOptions();
  const o = sanitizeOverlayOptions(options);
  const params = new URLSearchParams();
  if (o.parts !== d.parts) params.set('p', o.parts);
  if (o.layout !== d.layout) params.set('l', o.layout);
  if (o.showNames !== d.showNames) params.set('n', o.showNames ? '1' : '0');
  if (o.showFerme !== d.showFerme) params.set('f', o.showFerme ? '1' : '0');
  if (o.showBreaker !== d.showBreaker) params.set('b', o.showBreaker ? '1' : '0');
  if (o.scale !== d.scale) params.set('s', String(o.scale));
  if (o.background !== d.background) params.set('bg', o.background);
  const query = params.toString();
  return `${origin.replace(/\/$/, '')}${overlayPath(room)}${query ? `?${query}` : ''}`;
}

export function loadOverlayOptions(
  storage: Pick<Storage, 'getItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): OverlayOptions {
  try {
    const raw = storage?.getItem(OVERLAY_STORAGE_KEY);
    return sanitizeOverlayOptions(raw ? JSON.parse(raw) : {});
  } catch {
    return getDefaultOverlayOptions();
  }
}

export function saveOverlayOptions(
  options: OverlayOptions,
  storage: Pick<Storage, 'setItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): void {
  try {
    storage?.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(options));
  } catch {
    // ignore
  }
}
