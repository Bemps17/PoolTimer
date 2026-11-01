import type { MirrorConnectionStatus } from './syncStatus';

/**
 * Voyant de synchro : vert = OK, orange = latence, rouge = ne marche pas. Aucun texte affiché (aria-label seulement).
 */
export type SyncLevel = 'ok' | 'slow' | 'down';

/** Aller-retour au-delà duquel l'écart télécommande / écran devient perceptible. */
export const SLOW_RTT_MS = 300;
/** Télécommande : push sans accusé de réception. */
export const ACK_SLOW_MS = 3_000;
export const ACK_DOWN_MS = 10_000;
/** Écran : chrono en marche sans nouvelle depuis… (la télécommande renvoie l'état toutes les 5 s). */
export const STALE_RUNNING_MS = 12_000;
export const STALE_DOWN_MS = 30_000;

export function controllerSyncLevel(input: {
  status: MirrorConnectionStatus;
  displayCount: number;
  rttMs: number | null;
  oldestUnackedAt: number | null;
  now: number;
}): SyncLevel {
  if (input.status !== 'live') return 'down';
  if (input.displayCount <= 0) return 'down';
  const waiting = input.oldestUnackedAt === null ? 0 : input.now - input.oldestUnackedAt;
  if (waiting > ACK_DOWN_MS) return 'down';
  if (waiting > ACK_SLOW_MS) return 'slow';
  if (input.rttMs !== null && input.rttMs > SLOW_RTT_MS) return 'slow';
  return 'ok';
}

export function displaySyncLevel(input: {
  status: MirrorConnectionStatus;
  controllerConnected: boolean;
  hasSnapshot: boolean;
  isRunning: boolean;
  lastSnapshotAt: number | null;
  rttMs: number | null;
  now: number;
}): SyncLevel {
  if (input.status !== 'live' || !input.controllerConnected || !input.hasSnapshot) return 'down';
  if (input.isRunning && input.lastSnapshotAt !== null) {
    const age = input.now - input.lastSnapshotAt;
    if (age > STALE_DOWN_MS) return 'down';
    if (age > STALE_RUNNING_MS) return 'slow';
  }
  if (input.rttMs !== null && input.rttMs > SLOW_RTT_MS) return 'slow';
  return 'ok';
}

export function syncLevelLabel(level: SyncLevel): string {
  switch (level) {
    case 'ok':
      return 'Synchronisation OK';
    case 'slow':
      return 'Synchronisation lente (latence)';
    case 'down':
      return 'Synchronisation interrompue';
    default: {
      const exhaustive: never = level;
      return exhaustive;
    }
  }
}
