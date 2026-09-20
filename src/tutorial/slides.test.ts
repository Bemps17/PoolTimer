import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TUTORIAL_SLIDES } from './slides';

describe('tutorial slides', () => {
  it('covers the main timer and the mirror remote / visual pair', () => {
    expect(TUTORIAL_SLIDES.length).toBeGreaterThanOrEqual(8);
    const ids = TUTORIAL_SLIDES.map((slide) => slide.id);
    expect(ids).toContain('accueil');
    expect(ids).toContain('miroir-remote');
    expect(ids).toContain('miroir-visuel');
    for (const slide of TUTORIAL_SLIDES) {
      expect(slide.title.length).toBeGreaterThan(3);
      expect(slide.caption.length).toBeGreaterThan(20);
      expect(slide.fileName).toMatch(/^slide-[\w-]+\.svg$/);
      expect(slide.image).toBe(`/tutorial/${slide.fileName}`);
      expect(
        slide.imageFallback.startsWith('data:image/svg+xml') ||
          slide.imageFallback.includes(slide.fileName) ||
          slide.imageFallback.includes('/assets/'),
        slide.id,
      ).toBe(true);
    }
  });

  it('ships each illustration as a bundled SVG and a public/tutorial copy', () => {
    for (const slide of TUTORIAL_SLIDES) {
      const bundled = new URL(`./assets/${slide.fileName}`, import.meta.url);
      const published = new URL(`../../public/tutorial/${slide.fileName}`, import.meta.url);
      expect(existsSync(fileURLToPath(bundled)), slide.fileName).toBe(true);
      expect(existsSync(fileURLToPath(published)), `public/${slide.fileName}`).toBe(true);
      expect(readFileSync(bundled, 'utf8')).toMatch(/<svg[\s>]/);
      expect(readFileSync(published, 'utf8')).toMatch(/<svg[\s>]/);
      const bytes = readFileSync(published);
      expect(bytes.toString('utf8')).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
      const forbidden = [...bytes].filter((code) => code < 32 && code !== 9 && code !== 10 && code !== 13);
      expect(forbidden, slide.fileName).toEqual([]);
    }
  });
});
