import { describe, expect, it } from 'vitest';
import { getDefaultConfig } from '../timer/config';
import { createInitialState, startTimer } from '../timer/engine';
import {
  buildSnapshot,
  displayPath,
  displayUrl,
  formatRoomCode,
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  parseClientMessage,
  parseDisplayRoom,
  remainingFromSnapshot,
} from './protocol';
import { EphemeralRoom } from './room';

describe('mirror protocol', () => {
  it('generates and validates short unambiguous room codes', () => {
    const code = generateRoomCode(() => new Uint8Array([0, 1, 2, 3, 4, 5]));
    expect(code).toHaveLength(6);
    expect(isValidRoomCode(code)).toBe(true);
    expect(isValidRoomCode('abc123')).toBe(false);
    expect(isValidRoomCode('OOOOOO')).toBe(false);
    expect(normalizeRoomCode('ab-c12 3')).toBe('ABC123');
    expect(formatRoomCode('AB3K7Q')).toBe('AB3 K7Q');
  });

  it('parses display routes /d/CODE and /display?room=', () => {
    expect(parseDisplayRoom('/d/AB3K7Q')).toBe('AB3K7Q');
    expect(parseDisplayRoom('/d/ab3k7q/')).toBe('AB3K7Q');
    expect(parseDisplayRoom('/display', '?room=AB3K7Q')).toBe('AB3K7Q');
    expect(parseDisplayRoom('/display', 'room=AB3K7Q')).toBe('AB3K7Q');
    expect(parseDisplayRoom('/')).toBeNull();
    expect(parseDisplayRoom('/d/NOPE')).toBeNull();
    expect(displayPath('ab3k7q')).toBe('/d/AB3K7Q');
    expect(displayUrl('https://pooltimer.vercel.app', 'AB3K7Q')).toBe('https://pooltimer.vercel.app/d/AB3K7Q');
  });

  it('builds a snapshot and interpolates remaining time from the controller clock', () => {
    const config = getDefaultConfig();
    const running = startTimer(createInitialState(config), 1_000);
    const snapshot = buildSnapshot(running, config, 1_000);
    expect(snapshot.isRunning).toBe(true);
    expect(snapshot.remainingTime).toBe(45_000);
    expect(snapshot.config.theme).toBe(config.theme);
    expect(remainingFromSnapshot(snapshot, 1_000)).toBe(45_000);
    expect(remainingFromSnapshot(snapshot, 6_000)).toBe(40_000);
    expect(remainingFromSnapshot({ ...snapshot, isRunning: false }, 20_000)).toBe(45_000);
    expect(remainingFromSnapshot(snapshot, 50_000)).toBe(0);
  });

  it('rejects malformed client pushes', () => {
    expect(parseClientMessage({ type: 'ping' })).toEqual({ type: 'ping' });
    expect(parseClientMessage({ type: 'push', seq: 1 })).toBeUndefined();
    expect(parseClientMessage({ type: 'nope' })).toBeUndefined();
  });
});

describe('ephemeral room', () => {
  it('lets one controller claim a room and rejects a second secret', () => {
    const room = new EphemeralRoom();
    expect(room.claimController('secret-a')).toBe('ok');
    expect(room.claimController('secret-a')).toBe('ok');
    expect(room.claimController('secret-b')).toBe('busy');
  });

  it('stores the latest snapshot for a late-joining display', () => {
    const room = new EphemeralRoom();
    const config = getDefaultConfig();
    const snapshot = buildSnapshot(createInitialState(config), config, 10);
    expect(room.acceptSnapshot(1, snapshot)).toBe(true);
    expect(room.snapshot?.remainingTime).toBe(45_000);
    expect(room.acceptSnapshot(0, snapshot)).toBe(false);
    expect(room.seq).toBe(1);
  });
});
