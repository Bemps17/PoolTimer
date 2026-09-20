import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CLASSIC_ALERT_TIME_SRC, CLASSIC_CLIC_SRC } from './playAlert';
import { MINIONS_ARGHH_SRC } from './minions';
import { SOUND_CATALOG, defaultIdsForPack } from './soundCatalog';

function publicFile(src: string): URL {
  return new URL(`../../public/${src.replace(/^\//, '')}`, import.meta.url);
}

describe('historic in-repo alert files', () => {
  it('keeps the original PoolTimer and Minions clips on disk', () => {
    const files = [CLASSIC_ALERT_TIME_SRC, CLASSIC_CLIC_SRC, MINIONS_ARGHH_SRC];
    for (const src of files) {
      const path = publicFile(src);
      expect(existsSync(path), src).toBe(true);
      const bytes = readFileSync(path);
      expect(bytes.length).toBeGreaterThan(1000);
      const header = bytes.subarray(0, 3).toString();
      const isId3 = bytes.subarray(0, 3).toString() === 'ID3';
      const isMpeg = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
      expect(isId3 || isMpeg || header === 'ID3', `${src} should be mp3`).toBe(true);
    }
  });

  it('defaults the classic pack to the original alert-time clip', () => {
    expect(defaultIdsForPack('classic').warning).toEqual(['classic-alert-time']);
    expect(SOUND_CATALOG.some((sound) => sound.id === 'classic-alert-time' && sound.src === CLASSIC_ALERT_TIME_SRC)).toBe(
      true,
    );
    expect(SOUND_CATALOG.some((sound) => sound.id === 'minions-arghh' && sound.src === MINIONS_ARGHH_SRC)).toBe(true);
    expect(SOUND_CATALOG.some((sound) => sound.id === 'classic-clic' && sound.src === CLASSIC_CLIC_SRC)).toBe(true);
  });
});
