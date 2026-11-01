import { isValidRoomCode, normalizeRoomCode } from './protocol';

const BETA_KEY = 'h8timer.beta.mirror';
const ROOM_KEY = 'h8timer.mirror.room';
const SECRET_KEY = 'h8timer.mirror.secret';

export function loadBetaMirrorEnabled(storage: Pick<Storage, 'getItem'> | undefined = localStorage): boolean {
  try {
    return storage?.getItem(BETA_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveBetaMirrorEnabled(
  enabled: boolean,
  storage: Pick<Storage, 'setItem' | 'removeItem'> | undefined = localStorage,
): void {
  try {
    if (!storage) return;
    if (enabled) storage.setItem(BETA_KEY, '1');
    else storage.removeItem(BETA_KEY);
  } catch {
    // ignore quota / private mode
  }
}

export function loadMirrorEnabled(storage: Pick<Storage, 'getItem'> | undefined = localStorage): boolean {
  return loadBetaMirrorEnabled(storage);
}

export function saveMirrorEnabled(
  enabled: boolean,
  storage: Pick<Storage, 'setItem' | 'removeItem'> | undefined = localStorage,
): void {
  saveBetaMirrorEnabled(enabled, storage);
}

type ReadStorage = Pick<Storage, 'getItem'>;
type WriteStorage = Pick<Storage, 'setItem'>;
type RemoveStorage = Pick<Storage, 'removeItem'>;

const SECRET_PATTERN = /^[a-f0-9]{32}$/;

function persistentStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

function legacySessionStorage(): Storage | undefined {
  try {
    return typeof sessionStorage === 'undefined' ? undefined : sessionStorage;
  } catch {
    return undefined;
  }
}

function readPair(storage: ReadStorage | undefined): { room: string; secret: string } | null {
  try {
    const room = storage?.getItem(ROOM_KEY);
    const secret = storage?.getItem(SECRET_KEY);
    if (!room || !secret) return null;
    if (!isValidRoomCode(room) || !SECRET_PATTERN.test(secret)) return null;
    return { room: normalizeRoomCode(room), secret };
  } catch {
    return null;
  }
}

/**
 * La salle (code + secret) est conservée sur l'appareil : fermer l'app ne change plus le code, donc le lien de
 * l'écran Visuel et l'overlay OBS restent valables. Seul « Fermer la salle » l'efface.
 * Migration : une salle de la v2.11 (sessionStorage) est reprise puis supprimée de la session.
 */
export function loadMirrorSession(
  storage: ReadStorage & Partial<WriteStorage> = persistentStorage() as Storage,
  legacy: (ReadStorage & Partial<RemoveStorage>) | undefined = legacySessionStorage(),
): { room: string; secret: string } | null {
  const current = readPair(storage);
  if (current) return current;
  const old = readPair(legacy);
  if (!old) return null;
  saveMirrorSession(old.room, old.secret, storage as WriteStorage);
  try {
    legacy?.removeItem?.(ROOM_KEY);
    legacy?.removeItem?.(SECRET_KEY);
  } catch {
    // ignore
  }
  return old;
}

export function saveMirrorSession(room: string, secret: string, storage: WriteStorage | undefined = persistentStorage()): void {
  try {
    storage?.setItem(ROOM_KEY, room);
    storage?.setItem(SECRET_KEY, secret);
  } catch {
    // ignore
  }
}

export function clearMirrorSession(
  storage: RemoveStorage | undefined = persistentStorage(),
  legacy: RemoveStorage | undefined = legacySessionStorage(),
): void {
  for (const target of [storage, legacy]) {
    try {
      target?.removeItem(ROOM_KEY);
      target?.removeItem(SECRET_KEY);
    } catch {
      // ignore
    }
  }
}
