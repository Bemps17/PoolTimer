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

export function loadMirrorSession(
  storage: Pick<Storage, 'getItem'> | undefined = sessionStorage,
): { room: string; secret: string } | null {
  try {
    const room = storage?.getItem(ROOM_KEY);
    const secret = storage?.getItem(SECRET_KEY);
    if (!room || !secret) return null;
    return { room, secret };
  } catch {
    return null;
  }
}

export function saveMirrorSession(
  room: string,
  secret: string,
  storage: Pick<Storage, 'setItem'> | undefined = sessionStorage,
): void {
  try {
    storage?.setItem(ROOM_KEY, room);
    storage?.setItem(SECRET_KEY, secret);
  } catch {
    // ignore
  }
}

export function clearMirrorSession(storage: Pick<Storage, 'removeItem'> | undefined = sessionStorage): void {
  try {
    storage?.removeItem(ROOM_KEY);
    storage?.removeItem(SECRET_KEY);
  } catch {
    // ignore
  }
}
