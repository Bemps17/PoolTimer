import { describe, expect, it } from 'vitest';
import {
  canAcceptDisplay,
  createRateLimiter,
  isAllowedOrigin,
  isMessageTooLarge,
  MAX_DISPLAYS_PER_ROOM,
  MAX_MESSAGE_BYTES,
} from './limits';
import { parseServerMessage } from './protocol';

describe('relais : limites de sécurité', () => {
  it('accepts the production domain, Vercel previews of this project, localhost and non-browser clients', () => {
    for (const origin of [
      'https://pooltimer.vercel.app',
      'https://pooltimer-w5f7dvped-bemps17s-projects.vercel.app',
      'https://pooltimer-git-claude-app-completion-roadmap-eyqp6k-bemps17s-projects.vercel.app',
      'http://localhost:5173',
      'http://127.0.0.1:8787',
      null,
      '',
    ]) {
      expect(isAllowedOrigin(origin), String(origin)).toBe(true);
    }
  });

  it('rejects foreign or look-alike origins', () => {
    for (const origin of [
      'https://evil.example',
      'https://pooltimer.vercel.app.evil.example',
      'https://evilpooltimer.vercel.app',
      'http://pooltimer.vercel.app',
      'https://other-w5f7dvped-bemps17s-projects.vercel.app',
      'https://pooltimer-x-attacker-projects.vercel.app',
      'null',
      'javascript:alert(1)',
    ]) {
      expect(isAllowedOrigin(origin), origin).toBe(false);
    }
  });

  it('accepts extra origins configured on the worker, exactly', () => {
    expect(isAllowedOrigin('https://club.example', 'https://club.example, https://autre.example')).toBe(true);
    expect(isAllowedOrigin('https://club.example.evil', 'https://club.example')).toBe(false);
  });

  it('bounds the message size (text and binary)', () => {
    expect(isMessageTooLarge('x'.repeat(MAX_MESSAGE_BYTES))).toBe(false);
    expect(isMessageTooLarge('x'.repeat(MAX_MESSAGE_BYTES + 1))).toBe(true);
    expect(isMessageTooLarge('é'.repeat(MAX_MESSAGE_BYTES))).toBe(true);
    expect(isMessageTooLarge(new ArrayBuffer(MAX_MESSAGE_BYTES + 1))).toBe(true);
    expect(isMessageTooLarge(new ArrayBuffer(10))).toBe(false);
  });

  it('rate limits bursts but lets normal traffic through (token bucket)', () => {
    const limiter = createRateLimiter({ capacity: 5, refillPerSec: 2 });
    const t0 = 1_000;
    expect([1, 2, 3, 4, 5].map(() => limiter.take(t0))).toEqual([true, true, true, true, true]);
    expect(limiter.take(t0)).toBe(false);
    expect(limiter.take(t0 + 500)).toBe(true); // 1 jeton rendu
    expect(limiter.take(t0 + 500)).toBe(false);
    expect(limiter.take(t0 + 60_000)).toBe(true); // se remplit, sans dépasser la capacité
    const burst = [1, 2, 3, 4, 5, 6].map(() => limiter.take(t0 + 60_000));
    expect(burst.filter(Boolean)).toHaveLength(4);
  });

  it('ignores a clock that goes backwards', () => {
    const limiter = createRateLimiter({ capacity: 2, refillPerSec: 1 });
    expect(limiter.take(10_000)).toBe(true);
    expect(limiter.take(5_000)).toBe(true);
    expect(limiter.take(5_000)).toBe(false);
  });

  it('caps the number of displays per room', () => {
    expect(canAcceptDisplay(0)).toBe(true);
    expect(canAcceptDisplay(MAX_DISPLAYS_PER_ROOM - 1)).toBe(true);
    expect(canAcceptDisplay(MAX_DISPLAYS_PER_ROOM)).toBe(false);
  });

  it('understands the new error codes on the client', () => {
    for (const code of ['too_large', 'rate_limited', 'room_full'] as const) {
      expect(parseServerMessage({ type: 'error', code, message: 'x' })).toEqual({ type: 'error', code, message: 'x' });
    }
    expect(parseServerMessage({ type: 'error', code: 'nope', message: 'x' })).toMatchObject({ code: 'unknown' });
  });
});
