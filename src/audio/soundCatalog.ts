export type AlertPackId = 'classic' | 'cretins' | 'minionsLike';
export type AlertPickMode = 'fixed' | 'random';
export type CriticalAlertStyle = 'oneshot' | 'repeat';
export type AlertTier = 'warning' | 'critical' | 'end';

export interface CatalogSound {
  id: string;
  pack: AlertPackId;
  label: string;
  /** Approximate playback length in seconds (oneshot 5s clips are ~5). */
  durationSec: number;
  kind: 'warning' | 'tick' | 'oneshot5s' | 'end';
  src?: string;
}

export const SOUND_CATALOG: CatalogSound[] = [
  { id: 'classic-warning', pack: 'classic', label: 'Cloche (classique)', durationSec: 0.4, kind: 'warning' },
  { id: 'classic-tick', pack: 'classic', label: 'Bip 1 s (classique)', durationSec: 0.12, kind: 'tick' },
  { id: 'classic-oneshot5s', pack: 'classic', label: 'Alerte ~5 s (classique)', durationSec: 5, kind: 'oneshot5s' },
  { id: 'classic-gong', pack: 'classic', label: 'Gong de fin (classique)', durationSec: 0.6, kind: 'end' },
  {
    id: 'cretins-couac',
    pack: 'cretins',
    label: 'Couac (original)',
    durationSec: 0.45,
    kind: 'warning',
    src: '/sound/original/cretins-couac.wav',
  },
  {
    id: 'cretins-glousse',
    pack: 'cretins',
    label: 'Gloussement (original)',
    durationSec: 0.55,
    kind: 'warning',
    src: '/sound/original/cretins-glousse.wav',
  },
  {
    id: 'cretins-tick',
    pack: 'cretins',
    label: 'Bip crétin 1 s (original)',
    durationSec: 0.18,
    kind: 'tick',
    src: '/sound/original/cretins-tick.wav',
  },
  {
    id: 'cretins-alerte5s',
    pack: 'cretins',
    label: 'Alerte ~5 s crétine (original)',
    durationSec: 5,
    kind: 'oneshot5s',
    src: '/sound/original/cretins-alerte5s.wav',
  },
  {
    id: 'cretins-fin',
    pack: 'cretins',
    label: 'Fin crétine (original)',
    durationSec: 0.7,
    kind: 'end',
    src: '/sound/original/cretins-fin.wav',
  },
  {
    id: 'minionslike-gazouillis',
    pack: 'minionsLike',
    label: 'Gazouillis (original)',
    durationSec: 0.5,
    kind: 'warning',
    src: '/sound/original/minionslike-gazouillis.wav',
  },
  {
    id: 'minionslike-wouah',
    pack: 'minionsLike',
    label: 'Wouah (original)',
    durationSec: 0.45,
    kind: 'warning',
    src: '/sound/original/minionslike-wouah.wav',
  },
  {
    id: 'minionslike-tick',
    pack: 'minionsLike',
    label: 'Bip 1 s minions-like (original)',
    durationSec: 0.16,
    kind: 'tick',
    src: '/sound/original/minionslike-tick.wav',
  },
  {
    id: 'minionslike-alerte5s',
    pack: 'minionsLike',
    label: 'Alerte ~5 s minions-like (original)',
    durationSec: 5,
    kind: 'oneshot5s',
    src: '/sound/original/minionslike-alerte5s.wav',
  },
  {
    id: 'minionslike-fin',
    pack: 'minionsLike',
    label: 'Fin minions-like (original)',
    durationSec: 0.75,
    kind: 'end',
    src: '/sound/original/minionslike-fin.wav',
  },
];

export const PACK_LABELS: Record<AlertPackId, string> = {
  classic: 'Pack classique',
  cretins: 'Pack Crétins (original)',
  minionsLike: 'Pack Minions-like (original)',
};

export function isAlertPackId(value: unknown): value is AlertPackId {
  return value === 'classic' || value === 'cretins' || value === 'minionsLike';
}

export function isAlertPickMode(value: unknown): value is AlertPickMode {
  return value === 'fixed' || value === 'random';
}

export function isCriticalAlertStyle(value: unknown): value is CriticalAlertStyle {
  return value === 'oneshot' || value === 'repeat';
}

export function catalogById(id: string): CatalogSound | undefined {
  return SOUND_CATALOG.find((sound) => sound.id === id);
}

export function soundsForPack(pack: AlertPackId): CatalogSound[] {
  return SOUND_CATALOG.filter((sound) => sound.pack === pack);
}

export function isCustomSoundId(id: string): boolean {
  return id.startsWith('custom:');
}

export function defaultIdsForPack(
  pack: AlertPackId,
  criticalStyle: CriticalAlertStyle = 'repeat',
): { warning: string[]; critical: string[]; end: string[] } {
  switch (pack) {
    case 'classic':
      return {
        warning: ['classic-warning'],
        critical: [criticalStyle === 'oneshot' ? 'classic-oneshot5s' : 'classic-tick'],
        end: ['classic-gong'],
      };
    case 'cretins':
      return {
        warning: ['cretins-couac', 'cretins-glousse'],
        critical: [criticalStyle === 'oneshot' ? 'cretins-alerte5s' : 'cretins-tick'],
        end: ['cretins-fin'],
      };
    case 'minionsLike':
      return {
        warning: ['minionslike-gazouillis', 'minionslike-wouah'],
        critical: [criticalStyle === 'oneshot' ? 'minionslike-alerte5s' : 'minionslike-tick'],
        end: ['minionslike-fin'],
      };
    default: {
      const exhaustive: never = pack;
      return exhaustive;
    }
  }
}

export function pickAlertSound(
  ids: string[],
  mode: AlertPickMode,
  random: () => number = Math.random,
): string | undefined {
  const cleaned = ids.filter((id) => typeof id === 'string' && id.length > 0);
  if (cleaned.length === 0) return undefined;
  if (mode === 'fixed' || cleaned.length === 1) return cleaned[0];
  const index = Math.min(cleaned.length - 1, Math.max(0, Math.floor(random() * cleaned.length)));
  return cleaned[index];
}

export function sanitizeSoundIdList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const ids = value.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, 24);
  return ids.length > 0 ? ids : fallback;
}

export function toggleSoundId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}
