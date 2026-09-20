import { describe, expect, it } from 'vitest';
import { buildMirrorWsUrl, getMirrorRelayHost } from './wsUrl';

describe('mirror websocket url', () => {
  it('appends /ws, room, role and secret', () => {
    expect(buildMirrorWsUrl('AB3K7Q', 'controller', 's3cret', 'ws://localhost:8787')).toBe(
      'ws://localhost:8787/ws?room=AB3K7Q&role=controller&secret=s3cret',
    );
  });

  it('upgrades http(s) and does not duplicate /ws', () => {
    expect(buildMirrorWsUrl('AB3K7Q', 'display', undefined, 'https://h8timer-mirror.example.workers.dev/ws')).toBe(
      'wss://h8timer-mirror.example.workers.dev/ws?room=AB3K7Q&role=display',
    );
  });

  it('returns undefined without a base URL', () => {
    expect(buildMirrorWsUrl('AB3K7Q', 'display', undefined, undefined)).toBeUndefined();
  });

  it('exposes the relay host without path, query or secret', () => {
    expect(getMirrorRelayHost('wss://h8timer-mirror.h8timer.workers.dev/ws?secret=s3cret')).toBe(
      'h8timer-mirror.h8timer.workers.dev',
    );
    expect(getMirrorRelayHost(undefined)).toBeNull();
  });
});
