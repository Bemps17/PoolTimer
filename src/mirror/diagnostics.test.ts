import { afterEach, describe, expect, it } from 'vitest';
import {
  clearMirrorDiagnostics,
  formatMirrorDiagnostics,
  getMirrorDiagnostics,
  logMirrorEvent,
  setMirrorDiagContext,
} from './diagnostics';

afterEach(() => {
  clearMirrorDiagnostics();
});

describe('mirror diagnostics', () => {
  it('keeps recent events and copy text with codes, seq, room, role, host — never the secret', () => {
    setMirrorDiagContext({
      version: '2.5.5',
      relayHost: 'h8timer-mirror.h8timer.workers.dev',
      role: 'controller',
      room: 'AB3K7Q',
      status: 'live',
      lastSeq: 4,
      snapshotReceived: false,
      displayCount: 1,
      lastPushOkAt: null,
      lastErrorCode: 'bad_push',
    });
    logMirrorEvent({
      ts: Date.parse('2026-09-20T16:42:01.000Z'),
      level: 'info',
      code: 'connect',
      role: 'controller',
      room: 'AB3K7Q',
      message: 'WS open',
    });
    logMirrorEvent({
      ts: Date.parse('2026-09-20T16:42:01.050Z'),
      level: 'info',
      code: 'welcome',
      role: 'controller',
      room: 'AB3K7Q',
      message: 'seq=0 displays=1 snapshot=no',
      seq: 0,
    });
    logMirrorEvent({
      ts: Date.parse('2026-09-20T16:42:01.200Z'),
      level: 'error',
      code: 'bad_push',
      role: 'controller',
      room: 'AB3K7Q',
      message: 'Snapshot invalide.',
      seq: 1,
    });
    logMirrorEvent({
      ts: Date.parse('2026-09-20T16:42:02.000Z'),
      level: 'warn',
      code: 'ws_close',
      role: 'controller',
      room: 'AB3K7Q',
      message: 'code=1006',
    });

    const state = getMirrorDiagnostics();
    expect(state.lastErrorCode).toBe('bad_push');
    expect(state.events.map((event) => event.code)).toEqual(['connect', 'welcome', 'bad_push', 'ws_close']);

    const copy = formatMirrorDiagnostics(state);
    expect(copy).toContain('H8timer v2.5.5');
    expect(copy).toContain('relayHost: h8timer-mirror.h8timer.workers.dev');
    expect(copy).toContain('role: controller');
    expect(copy).toContain('room: AB3K7Q');
    expect(copy).toContain('seq: 4');
    expect(copy).toContain('snapshotReceived: no');
    expect(copy).toContain('lastError: bad_push');
    expect(copy).toContain('ERROR bad_push');
    expect(copy).toContain('Snapshot invalide.');
    expect(copy).toContain('WARN  ws_close');
    expect(copy).toContain('code=1006');
    expect(copy).not.toMatch(/secret=/i);
    expect(copy).not.toContain('wss://');
  });

  it('caps history at 80 events', () => {
    for (let index = 0; index < 90; index += 1) {
      logMirrorEvent({
        ts: index,
        level: 'info',
        code: 'push',
        role: 'controller',
        room: 'AB3K7Q',
        message: `seq=${index}`,
        seq: index,
      });
    }
    const state = getMirrorDiagnostics();
    expect(state.events).toHaveLength(80);
    expect(state.events[0]?.seq).toBe(10);
    expect(state.events.at(-1)?.seq).toBe(89);
  });
});
