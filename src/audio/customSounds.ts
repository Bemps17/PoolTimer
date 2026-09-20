export const CUSTOM_SOUND_PREFIX = 'custom:';
export const MAX_CUSTOM_SOUND_BYTES = 1_500_000;
export const MAX_CUSTOM_SOUNDS = 12;

export interface CustomSoundRecord {
  id: string;
  name: string;
  mime: string;
  blob: Blob;
  createdAt: number;
}

const DB_NAME = 'h8timer-sounds';
const STORE = 'clips';
const memory = new Map<string, CustomSoundRecord>();

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${CUSTOM_SOUND_PREFIX}${crypto.randomUUID()}`;
  }
  return `${CUSTOM_SOUND_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function isAllowedAudioFile(file: Pick<File, 'type' | 'size' | 'name'>): string | null {
  if (file.size <= 0 || file.size > MAX_CUSTOM_SOUND_BYTES) {
    return `Fichier trop lourd (max ${Math.round(MAX_CUSTOM_SOUND_BYTES / 1000)} Ko).`;
  }
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const okType = type.startsWith('audio/') || type === 'video/ogg';
  const okExt = /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(name);
  if (!okType && !okExt) return 'Importez un fichier audio (mp3, wav, ogg, m4a…).';
  return null;
}

export async function listCustomSounds(): Promise<CustomSoundRecord[]> {
  const db = await openDb().catch(() => null);
  if (!db) {
    return [...memory.values()].sort((a, b) => a.createdAt - b.createdAt);
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => {
      const rows = (request.result as CustomSoundRecord[]).sort((a, b) => a.createdAt - b.createdAt);
      resolve(rows);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveCustomSound(file: File): Promise<CustomSoundRecord> {
  const existing = await listCustomSounds();
  if (existing.length >= MAX_CUSTOM_SOUNDS) {
    throw new Error(`Maximum ${MAX_CUSTOM_SOUNDS} sons importés.`);
  }
  const problem = isAllowedAudioFile(file);
  if (problem) throw new Error(problem);
  const record: CustomSoundRecord = {
    id: randomId(),
    name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Import',
    mime: file.type || 'audio/mpeg',
    blob: file,
    createdAt: Date.now(),
  };
  memory.set(record.id, record);
  const db = await openDb().catch(() => null);
  if (db) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  return record;
}

export async function deleteCustomSound(id: string): Promise<void> {
  memory.delete(id);
  const db = await openDb().catch(() => null);
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCustomSound(id: string): Promise<CustomSoundRecord | undefined> {
  if (memory.has(id)) return memory.get(id);
  const db = await openDb().catch(() => null);
  if (!db) return undefined;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result as CustomSoundRecord | undefined);
    request.onerror = () => reject(request.error);
  });
}
