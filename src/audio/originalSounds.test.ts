import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SOUND_CATALOG } from './soundCatalog';

describe('original sound files', () => {
  it('ships synthesized wavs for original packs (no franchise samples)', () => {
    const withSrc = SOUND_CATALOG.filter((sound) => sound.src);
    expect(withSrc.length).toBeGreaterThanOrEqual(8);
    for (const sound of withSrc) {
      const relative = sound.src!.replace(/^\//, '');
      const fileUrl = new URL(`../../public/${relative}`, import.meta.url);
      expect(existsSync(fileUrl), relative).toBe(true);
      const bytes = readFileSync(fileUrl);
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
      expect(bytes.length).toBeGreaterThan(100);
    }
  });
});
