import { describe, expect, it } from 'vitest';
import { clearMirrorSession, loadMirrorSession, saveMirrorSession } from './storage';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

const ROOM = 'AB3K7Q';
const SECRET = '0123456789abcdef0123456789abcdef';

describe('salle miroir persistante', () => {
  it('survives closing the app: saved in the persistent storage, not only the session', () => {
    const persistent = fakeStorage();
    const session = fakeStorage();
    saveMirrorSession(ROOM, SECRET, persistent);
    expect(loadMirrorSession(persistent, session)).toEqual({ room: ROOM, secret: SECRET });
    // nouvelle « session » du navigateur : la salle est toujours là
    expect(loadMirrorSession(persistent, fakeStorage())).toEqual({ room: ROOM, secret: SECRET });
  });

  it('migrates a v2.11 session-only room so the OBS link keeps working after the update', () => {
    const persistent = fakeStorage();
    const session = fakeStorage({ 'h8timer.mirror.room': ROOM, 'h8timer.mirror.secret': SECRET });
    expect(loadMirrorSession(persistent, session)).toEqual({ room: ROOM, secret: SECRET });
    expect(persistent.data.get('h8timer.mirror.room')).toBe(ROOM);
    expect(session.data.size).toBe(0);
  });

  it('forgets the room on close', () => {
    const persistent = fakeStorage();
    const session = fakeStorage();
    saveMirrorSession(ROOM, SECRET, persistent);
    clearMirrorSession(persistent, session);
    expect(loadMirrorSession(persistent, session)).toBeNull();
  });

  it('ignores corrupted or tampered stored values', () => {
    for (const stored of [
      { 'h8timer.mirror.room': 'nope', 'h8timer.mirror.secret': SECRET },
      { 'h8timer.mirror.room': ROOM, 'h8timer.mirror.secret': '<script>' },
      { 'h8timer.mirror.room': ROOM },
      {},
    ]) {
      expect(loadMirrorSession(fakeStorage(stored), fakeStorage())).toBeNull();
    }
  });

  it('never throws when storage is unavailable', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    expect(() => saveMirrorSession(ROOM, SECRET, broken)).not.toThrow();
    expect(loadMirrorSession(broken, broken)).toBeNull();
    expect(() => clearMirrorSession(broken, broken)).not.toThrow();
  });
});
