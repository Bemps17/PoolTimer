import type { TimerConfig } from '../timer/types';

/**
 * Volume maximum des alertes.
 * Une page web ne peut jamais dépasser le volume média du téléphone (réglé par l'utilisateur) : on garantit donc
 * que l'application pousse le signal au maximum SOUS ce plafond — niveau 0 dB, gain de +6 dB et limiteur à -1 dBFS
 * pour relever le niveau perçu des fichiers (crêtes mesurées entre -2,5 et -7 dBFS) sans saturer.
 */

export type VolumeMode = 'max' | 'custom';

export const MAX_VOLUME_DB = 0;
export const LOUDNESS_BOOST_DB = 6;
export const LIMITER_THRESHOLD_DB = -1;

export function isVolumeMode(value: unknown): value is VolumeMode {
  return value === 'max' || value === 'custom';
}

/** Volume (dB) réellement appliqué au maître : 0 dB en mode maximum, curseur sinon. */
export function effectiveVolumeDb(config: Pick<TimerConfig, 'volume' | 'volumeMode'>): number {
  if (config.volumeMode === 'max') return MAX_VOLUME_DB;
  return Number.isFinite(config.volume) ? Math.min(MAX_VOLUME_DB, config.volume) : MAX_VOLUME_DB;
}

/** Gain additionnel (dB) avant le limiteur : seulement en mode maximum. */
export function boostDb(config: Pick<TimerConfig, 'volumeMode'>): number {
  return config.volumeMode === 'max' ? LOUDNESS_BOOST_DB : 0;
}
