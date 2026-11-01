import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElementPool, registerAudioRouter } from './outputRoute';

type FakeAudio = { key: string; n: number };
let made = 0;
const factory = (key: string) => ({ key, n: (made += 1) }) as unknown as HTMLAudioElement;

afterEach(() => registerAudioRouter(null));

describe('sortie audio : chaîne maître avec repli direct', () => {
  it('uses the master chain (gain + limiter) when the audio context runs, and reuses the routed element', () => {
    const router = vi.fn(() => true);
    registerAudioRouter(router, () => true);
    const pool = createElementPool(factory);
    const first = pool.acquire('/sound/a.mp3');
    const again = pool.acquire('/sound/a.mp3');
    expect(first.routed).toBe(true);
    expect(again.audio).toBe(first.audio);
    expect(router).toHaveBeenCalledTimes(1);
  });

  it('falls back to a separate, never-routed element while the context is suspended (alert stays audible)', () => {
    let running = true;
    const router = vi.fn(() => true);
    registerAudioRouter(router, () => running);
    const pool = createElementPool(factory);
    const routed = pool.acquire('/sound/a.mp3');
    running = false;
    const direct = pool.acquire('/sound/a.mp3');
    expect(direct.routed).toBe(false);
    expect(direct.audio).not.toBe(routed.audio);
    expect(router).toHaveBeenCalledTimes(1); // l'élément direct n'est jamais branché sur la chaîne
    running = true;
    expect(pool.acquire('/sound/a.mp3').audio).toBe(routed.audio);
  });

  it('falls back to direct output when routing fails or no router exists', () => {
    const pool = createElementPool(factory);
    expect(pool.acquire('/x').routed).toBe(false);
    registerAudioRouter(() => {
      throw new Error('InvalidStateError');
    }, () => true);
    const failed = pool.acquire('/y');
    expect(failed.routed).toBe(false);
    expect((failed.audio as unknown as FakeAudio).key).toBe('/y');
  });

  it('never throws if the readiness probe itself fails', () => {
    registerAudioRouter(() => true, () => {
      throw new Error('closed');
    });
    expect(createElementPool(factory).acquire('/z').routed).toBe(false);
  });
});
