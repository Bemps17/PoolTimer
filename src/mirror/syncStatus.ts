export type MirrorConnectionStatus = 'idle' | 'connecting' | 'live' | 'error';

export const DISPLAY_SNAPSHOT_WAIT_MS = 2500;
export const CONTROLLER_SYNC_WAIT_MS = 3000;

export type ControllerSyncHealth = 'idle' | 'connecting' | 'waiting_display' | 'waiting_sync' | 'ok' | 'error';

export interface ControllerSyncView {
  chip: string;
  detail: string;
  health: ControllerSyncHealth;
}

export interface DisplaySyncView {
  label: string;
  waitingForSnapshot: boolean;
}

export function controllerSyncStatus(input: {
  status: MirrorConnectionStatus;
  error: string | null;
  displayCount: number;
  lastPushOkAt: number | null;
  liveSince: number | null;
  now: number;
  room?: string | null;
}): ControllerSyncView {
  switch (input.status) {
    case 'error':
      return {
        chip: input.error ?? 'Erreur miroir',
        detail: input.error ?? 'Erreur de connexion',
        health: 'error',
      };
    case 'idle':
      return { chip: '', detail: 'Aucune salle ouverte.', health: 'idle' };
    case 'connecting':
      return { chip: 'Connexion…', detail: 'Connexion au relais…', health: 'connecting' };
    case 'live':
      break;
    default: {
      const exhaustive: never = input.status;
      return exhaustive;
    }
  }

  if (input.displayCount <= 0) {
    return {
      chip: input.room ? `Bêta · ${input.room} · en attente d’un écran` : 'En attente d’un écran',
      detail: 'Salle active · en attente d’un écran',
      health: 'waiting_display',
    };
  }

  if (input.lastPushOkAt != null) {
    const screens = `${input.displayCount} écran${input.displayCount > 1 ? 's' : ''}`;
    return {
      chip: 'Écran lié · sync OK',
      detail: `Écran lié · sync OK · ${screens}`,
      health: 'ok',
    };
  }

  const waited = input.liveSince != null && input.now - input.liveSince >= CONTROLLER_SYNC_WAIT_MS;
  if (waited) {
    return {
      chip: 'Écran lié · pas de sync',
      detail: 'Écran lié · pas de sync (le relais n’acquitte pas les pushes)',
      health: 'waiting_sync',
    };
  }

  return {
    chip: 'Écran lié · sync…',
    detail: `Salle active · ${input.displayCount} écran${input.displayCount > 1 ? 's' : ''} · sync…`,
    health: 'waiting_sync',
  };
}

export function displaySyncStatus(input: {
  status: MirrorConnectionStatus;
  error: string | null;
  hasSnapshot: boolean;
  lastSnapshotAt: number | null;
  liveSince: number | null;
  now: number;
}): DisplaySyncView {
  switch (input.status) {
    case 'error':
      return { label: input.error ?? 'Erreur de connexion', waitingForSnapshot: true };
    case 'connecting':
      return { label: 'Connexion…', waitingForSnapshot: true };
    case 'idle':
      return { label: 'Inactif', waitingForSnapshot: true };
    case 'live':
      break;
    default: {
      const exhaustive: never = input.status;
      return exhaustive;
    }
  }

  if (!input.hasSnapshot) {
    const waited = input.liveSince != null && input.now - input.liveSince >= DISPLAY_SNAPSHOT_WAIT_MS;
    return {
      label: waited ? 'En attente de la télécommande…' : 'Synchronisation…',
      waitingForSnapshot: true,
    };
  }

  const ageSec =
    input.lastSnapshotAt == null ? 0 : Math.max(0, Math.floor((input.now - input.lastSnapshotAt) / 1000));
  return {
    label: ageSec < 2 ? 'Sync OK' : `Sync OK · ${ageSec}s`,
    waitingForSnapshot: false,
  };
}
