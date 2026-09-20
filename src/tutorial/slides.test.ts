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
      expect(slide.image.startsWith('/tutorial/')).toBe(true);
      expect(slide.image.endsWith('.svg')).toBe(true);
    }
  });
});
