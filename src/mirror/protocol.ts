import { sanitizePlayerName } from '../timer/playerName';
import type { EngineState, PlayerId, ShotKind, Theme, TimerConfig } from '../timer/types';

export const MIRROR_PROTOCOL = 1;
export const ROOM_CODE_LENGTH = 6;
export const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type MirrorRole = 'controller' | 'display';

export interface MirrorDisplayConfig {
  tempsBase: number;
  tempsApresCasse: number;
  tempsExtension: number;
  seuilAlerte: number;
  seuilCritique: number;
  affichageMs: boolean;
  tailleChiffres: number;
  p1Name: string;
  p1Color: string;
  p2Name: string;
  p2Color: string;
  theme: Theme;
}

export interface MirrorSnapshot {
  remainingTime: number;
  isRunning: boolean;
  expectedEnd: number;
  controllerNow: number;
  currentPlayer: PlayerId;
  extensionsUsedInGame: Record<PlayerId, boolean>;
  isExtensionUsedForShot: boolean;
  shotKind: ShotKind;
  config: MirrorDisplayConfig;
}

export type ClientMessage =
  | { type: 'push'; seq: number; snapshot: MirrorSnapshot }
  | { type: 'ping' };

export type ServerMessage =
  | {
      type: 'welcome';
      room: string;
      role: MirrorRole;
      displayCount: number;
      controllerConnected: boolean;
      serverTime: number;
      snapshot: MirrorSnapshot | null;
      seq: number;
    }
  | { type: 'snapshot'; seq: number; snapshot: MirrorSnapshot; serverTime: number }
  | { type: 'push_ok'; seq: number }
  | { type: 'peers'; displayCount: number; controllerConnected: boolean }
  | { type: 'error'; code: MirrorErrorCode; message: string }
  | { type: 'pong'; serverTime: number };

export type MirrorErrorCode =
  | 'room_busy'
  | 'invalid_room'
  | 'unauthorized'
  | 'bad_push'
  | 'stale_seq'
  | 'unknown';

export const WS_CLOSE_ROOM_BUSY = 4009;

export function generateRoomCode(
  randomBytes: (size: number) => Uint8Array = (size) => crypto.getRandomValues(new Uint8Array(size)),
): string {
  const bytes = randomBytes(ROOM_CODE_LENGTH);
  let code = '';
  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    code += ROOM_ALPHABET[bytes[index]! % ROOM_ALPHABET.length];
  }
  return code;
}

export function generateRoomSecret(
  randomBytes: (size: number) => Uint8Array = (size) => crypto.getRandomValues(new Uint8Array(size)),
): string {
  const bytes = randomBytes(16);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function normalizeRoomCode(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function isValidRoomCode(raw: string): boolean {
  const code = normalizeRoomCode(raw);
  if (code.length !== ROOM_CODE_LENGTH) return false;
  for (const char of code) {
    if (!ROOM_ALPHABET.includes(char)) return false;
  }
  return true;
}

export function formatRoomCode(code: string): string {
  const normalized = normalizeRoomCode(code);
  if (normalized.length !== ROOM_CODE_LENGTH) return normalized;
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

export function displayPath(room: string): string {
  return `/d/${normalizeRoomCode(room)}`;
}

export function displayUrl(origin: string, room: string): string {
  return `${origin.replace(/\/$/, '')}${displayPath(room)}`;
}

export function parseDisplayRoom(pathname: string, search = ''): string | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  const fromPath = path.match(/^\/d\/([A-Za-z0-9]{4,8})$/i) ?? path.match(/^\/display\/([A-Za-z0-9]{4,8})$/i);
  if (fromPath) {
    const code = normalizeRoomCode(fromPath[1]);
    return isValidRoomCode(code) ? code : null;
  }
  if (path === '/display') {
    const room = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('room');
    if (!room) return null;
    const code = normalizeRoomCode(room);
    return isValidRoomCode(code) ? code : null;
  }
  return null;
}

export function toDisplayConfig(config: TimerConfig): MirrorDisplayConfig {
  return {
    tempsBase: config.tempsBase,
    tempsApresCasse: config.tempsApresCasse,
    tempsExtension: config.tempsExtension,
    seuilAlerte: config.seuilAlerte,
    seuilCritique: config.seuilCritique,
    affichageMs: config.affichageMs,
    tailleChiffres: config.tailleChiffres,
    p1Name: sanitizePlayerName(config.p1Name, 'P1'),
    p1Color: config.p1Color,
    p2Name: sanitizePlayerName(config.p2Name, 'P2'),
    p2Color: config.p2Color,
    theme: config.theme,
  };
}

export function buildSnapshot(state: EngineState, config: TimerConfig, now: number): MirrorSnapshot {
  return {
    remainingTime: state.remainingTime,
    isRunning: state.isRunning,
    expectedEnd: state.expectedTime,
    controllerNow: now,
    currentPlayer: state.currentPlayer,
    extensionsUsedInGame: { ...state.extensionsUsedInGame },
    isExtensionUsedForShot: state.isExtensionUsedForShot,
    shotKind: state.shotKind,
    config: toDisplayConfig(config),
  };
}

export function remainingAtSend(snapshot: MirrorSnapshot): number {
  if (snapshot.isRunning && snapshot.expectedEnd > 0) {
    return Math.max(0, snapshot.expectedEnd - snapshot.controllerNow);
  }
  return Math.max(0, snapshot.remainingTime);
}

export function remainingFromSnapshot(snapshot: MirrorSnapshot, now: number, receivedAt: number): number {
  if (!snapshot.isRunning) return Math.max(0, snapshot.remainingTime);
  return Math.max(0, remainingAtSend(snapshot) - (now - receivedAt));
}

export function seqFromWelcome(seq: number): number {
  if (!Number.isFinite(seq) || seq < 0) return 0;
  return seq;
}

export function nextPushSeq(currentSeq: number): number {
  return currentSeq + 1;
}

export function parseClientMessage(raw: unknown): ClientMessage | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const message = raw as { type?: unknown };
  switch (message.type) {
    case 'ping':
      return { type: 'ping' };
    case 'push': {
      const seq = (raw as { seq?: unknown }).seq;
      const snapshot = parseSnapshot((raw as { snapshot?: unknown }).snapshot);
      if (typeof seq !== 'number' || !Number.isFinite(seq) || !snapshot) return undefined;
      return { type: 'push', seq, snapshot };
    }
    default:
      return undefined;
  }
}

export function parseSnapshot(raw: unknown): MirrorSnapshot | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = raw as Partial<MirrorSnapshot>;
  if (typeof value.remainingTime !== 'number' || !Number.isFinite(value.remainingTime)) return undefined;
  if (typeof value.isRunning !== 'boolean') return undefined;
  if (typeof value.expectedEnd !== 'number' || !Number.isFinite(value.expectedEnd)) return undefined;
  if (typeof value.controllerNow !== 'number' || !Number.isFinite(value.controllerNow)) return undefined;
  if (value.currentPlayer !== 1 && value.currentPlayer !== 2) return undefined;
  if (value.shotKind !== 'base' && value.shotKind !== 'apresCasse') return undefined;
  if (typeof value.isExtensionUsedForShot !== 'boolean') return undefined;
  const extensions = value.extensionsUsedInGame;
  if (!extensions || typeof extensions !== 'object') return undefined;
  if (typeof extensions[1] !== 'boolean' || typeof extensions[2] !== 'boolean') return undefined;
  const config = parseDisplayConfig(value.config);
  if (!config) return undefined;
  return {
    remainingTime: value.remainingTime,
    isRunning: value.isRunning,
    expectedEnd: value.expectedEnd,
    controllerNow: value.controllerNow,
    currentPlayer: value.currentPlayer,
    extensionsUsedInGame: { 1: extensions[1], 2: extensions[2] },
    isExtensionUsedForShot: value.isExtensionUsedForShot,
    shotKind: value.shotKind,
    config,
  };
}

function parseDisplayConfig(raw: unknown): MirrorDisplayConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = raw as Partial<MirrorDisplayConfig>;
  const theme = value.theme;
  if (theme !== 'sombre' && theme !== 'light' && theme !== 'cyberpunk' && theme !== 'ffb' && theme !== 'fbep') {
    return undefined;
  }
  const requiredNumbers: (keyof MirrorDisplayConfig)[] = [
    'tempsBase',
    'tempsApresCasse',
    'tempsExtension',
    'seuilAlerte',
    'seuilCritique',
    'tailleChiffres',
  ];
  for (const key of requiredNumbers) {
    if (typeof value[key] !== 'number' || !Number.isFinite(value[key] as number)) return undefined;
  }
  if (typeof value.affichageMs !== 'boolean') return undefined;
  if (typeof value.p1Name !== 'string' || typeof value.p2Name !== 'string') return undefined;
  if (typeof value.p1Color !== 'string' || typeof value.p2Color !== 'string') return undefined;
  return {
    tempsBase: value.tempsBase as number,
    tempsApresCasse: value.tempsApresCasse as number,
    tempsExtension: value.tempsExtension as number,
    seuilAlerte: value.seuilAlerte as number,
    seuilCritique: value.seuilCritique as number,
    affichageMs: value.affichageMs,
    tailleChiffres: value.tailleChiffres as number,
    p1Name: sanitizePlayerName(value.p1Name, 'P1'),
    p1Color: value.p1Color,
    p2Name: sanitizePlayerName(value.p2Name, 'P2'),
    p2Color: value.p2Color,
    theme,
  };
}

export function parseServerMessage(raw: unknown): ServerMessage | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const message = raw as { type?: unknown };
  switch (message.type) {
    case 'welcome': {
      const value = raw as ServerMessage & { type: 'welcome' };
      if (typeof value.room !== 'string' || (value.role !== 'controller' && value.role !== 'display')) return undefined;
      if (typeof value.displayCount !== 'number' || typeof value.controllerConnected !== 'boolean') return undefined;
      if (typeof value.serverTime !== 'number' || !Number.isFinite(value.serverTime)) return undefined;
      if (typeof value.seq !== 'number' || !Number.isFinite(value.seq)) return undefined;
      const snapshot = value.snapshot == null ? null : (parseSnapshot(value.snapshot) ?? null);
      return {
        type: 'welcome',
        room: value.room,
        role: value.role,
        displayCount: value.displayCount,
        controllerConnected: value.controllerConnected,
        serverTime: value.serverTime,
        snapshot,
        seq: value.seq,
      };
    }
    case 'snapshot': {
      const value = raw as { seq?: unknown; snapshot?: unknown; serverTime?: unknown };
      const snapshot = parseSnapshot(value.snapshot);
      if (!snapshot || typeof value.seq !== 'number' || typeof value.serverTime !== 'number') return undefined;
      return { type: 'snapshot', seq: value.seq, snapshot, serverTime: value.serverTime };
    }
    case 'peers': {
      const value = raw as { displayCount?: unknown; controllerConnected?: unknown };
      if (typeof value.displayCount !== 'number' || typeof value.controllerConnected !== 'boolean') return undefined;
      return {
        type: 'peers',
        displayCount: value.displayCount,
        controllerConnected: value.controllerConnected,
      };
    }
    case 'error': {
      const value = raw as { code?: unknown; message?: unknown };
      if (typeof value.message !== 'string') return undefined;
      const code = asErrorCode(value.code);
      return { type: 'error', code, message: value.message };
    }
    case 'push_ok': {
      const value = raw as { seq?: unknown };
      if (typeof value.seq !== 'number' || !Number.isFinite(value.seq)) return undefined;
      return { type: 'push_ok', seq: value.seq };
    }
    case 'pong': {
      const value = raw as { serverTime?: unknown };
      if (typeof value.serverTime !== 'number') return undefined;
      return { type: 'pong', serverTime: value.serverTime };
    }
    default:
      return undefined;
  }
}

function asErrorCode(value: unknown): MirrorErrorCode {
  switch (value) {
    case 'room_busy':
    case 'invalid_room':
    case 'unauthorized':
    case 'bad_push':
    case 'stale_seq':
    case 'unknown':
      return value;
    default:
      return 'unknown';
  }
}
