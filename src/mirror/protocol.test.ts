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
  nextPushSeq,
  normalizeRoomCode,
  parseClientMessage,
  parseDisplayRoom,
  parseServerMessage,
  remainingAtSend,
  remainingFromSnapshot,
  seqFromWelcome,
  toDisplayConfig,
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

  it('builds a snapshot and interpolates remaining from receive-time, not wall-clock match', () => {
    const config = getDefaultConfig();
    const running = startTimer(createInitialState(config), 1_000);
    const snapshot = buildSnapshot(running, config, 1_000);
    expect(snapshot.isRunning).toBe(true);
    expect(snapshot.remainingTime).toBe(45_000);
    expect(snapshot.expectedEnd).toBe(46_000);
    expect(snapshot.config.theme).toBe(config.theme);
    expect(remainingAtSend(snapshot)).toBe(45_000);

    const receivedAt = 9_000_000;
    expect(remainingFromSnapshot(snapshot, receivedAt, receivedAt)).toBe(45_000);
    expect(remainingFromSnapshot(snapshot, receivedAt + 5_000, receivedAt)).toBe(40_000);
    expect(remainingFromSnapshot({ ...snapshot, isRunning: false }, receivedAt + 20_000, receivedAt)).toBe(45_000);
    expect(remainingFromSnapshot(snapshot, receivedAt + 50_000, receivedAt)).toBe(0);
  });

  it('prefers expectedEnd for remaining-at-send when the timer is running', () => {
    const config = getDefaultConfig();
    const snapshot = buildSnapshot(startTimer(createInitialState(config), 1_000), config, 1_000);
    const skewed = { ...snapshot, remainingTime: 12_000, expectedEnd: 46_000, controllerNow: 1_000 };
    expect(remainingAtSend(skewed)).toBe(45_000);
    expect(remainingFromSnapshot(skewed, 10_000, 10_000)).toBe(45_000);
    expect(remainingFromSnapshot({ ...skewed, expectedEnd: 0 }, 10_000, 10_000)).toBe(12_000);
  });

  it('syncs controller seq from welcome so the next push is accepted after reconnect', () => {
    const room = new EphemeralRoom();
    const config = getDefaultConfig();
    const snapshot = buildSnapshot(createInitialState(config), config, 10);
    room.claimController('secret-a');
    expect(room.acceptSnapshot(3, snapshot)).toBe(true);

    const welcomeSeq = seqFromWelcome(room.seq);
    expect(welcomeSeq).toBe(3);
    const nextSeq = nextPushSeq(welcomeSeq);
    expect(nextSeq).toBe(4);
    expect(room.acceptSnapshot(nextSeq, snapshot)).toBe(true);
    expect(room.seq).toBe(4);
  });

  it('parses welcome seq for the controller', () => {
    const message = parseServerMessage({
      type: 'welcome',
      room: 'AB3K7Q',
      role: 'controller',
      displayCount: 1,
      controllerConnected: true,
      serverTime: 100,
      snapshot: null,
      seq: 7,
    });
    expect(message).toEqual(expect.objectContaining({ type: 'welcome', seq: 7 }));
    expect(seqFromWelcome(7)).toBe(7);
    expect(nextPushSeq(seqFromWelcome(7))).toBe(8);
  });

  it('keeps full player names on the display snapshot and caps the wire length', () => {
    const config = { ...getDefaultConfig(), p1Name: 'Jean-Baptiste Moreau', p2Name: 'Anne Dupont' };
    const display = toDisplayConfig(config);
    expect(display.p1Name).toBe('Jean-Baptiste Moreau');
    expect(display.p2Name).toBe('Anne Dupont');

    const snapshot = buildSnapshot(createInitialState(config), config, 1_000);
    const parsed = parseServerMessage({
      type: 'welcome',
      room: 'AB3K7Q',
      role: 'display',
      displayCount: 1,
      controllerConnected: true,
      serverTime: 100,
      snapshot,
      seq: 1,
    });
    expect(parsed).toEqual(
      expect.objectContaining({
        type: 'welcome',
        snapshot: expect.objectContaining({
          config: expect.objectContaining({ p1Name: 'Jean-Baptiste Moreau', p2Name: 'Anne Dupont' }),
        }),
      }),
    );
  });

  it('forwards empty player names to the visual display without injecting P1', () => {
    const config = { ...getDefaultConfig(), p1Name: '', p2Name: 'P' };
    expect(toDisplayConfig(config).p1Name).toBe('');
    expect(toDisplayConfig(config).p2Name).toBe('P');
  });

  it('rejects malformed client pushes', () => {
    expect(parseClientMessage({ type: 'ping' })).toEqual({ type: 'ping' });
    expect(parseClientMessage({ type: 'push', seq: 1 })).toBeUndefined();
    expect(parseClientMessage({ type: 'nope' })).toBeUndefined();
  });

  it('parses push_ok and protocol error codes', () => {
    expect(parseServerMessage({ type: 'push_ok', seq: 4 })).toEqual({ type: 'push_ok', seq: 4 });
    expect(parseServerMessage({ type: 'error', code: 'bad_push', message: 'Snapshot invalide.' })).toEqual({
      type: 'error',
      code: 'bad_push',
      message: 'Snapshot invalide.',
    });
    expect(parseServerMessage({ type: 'error', code: 'stale_seq', message: 'too old' })).toEqual({
      type: 'error',
      code: 'stale_seq',
      message: 'too old',
    });
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
    expect(room.acceptSnapshot(1, snapshot)).toBe(true);
  });

  it('resets seq on controller reclaim so reconnect can publish from 1 again', () => {
    const room = new EphemeralRoom();
    const config = getDefaultConfig();
    const snapshot = buildSnapshot(createInitialState(config), config, 10);
    expect(room.claimController('secret-a')).toBe('ok');
    expect(room.acceptSnapshot(5, snapshot)).toBe(true);
    expect(room.seq).toBe(5);

    expect(room.claimController('secret-a')).toBe('ok');
    expect(room.seq).toBe(0);
    expect(room.snapshot?.remainingTime).toBe(45_000);
    expect(room.acceptSnapshot(1, snapshot)).toBe(true);
    expect(room.seq).toBe(1);
  });
});
