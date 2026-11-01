import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Cibles tactiles : 44 × 44 px minimum (WCAG 2.5.5 / recommandations Apple et Google),
 * soit 2.75rem. Pendant un match, l'arbitre tape vite, parfois les mains moites.
 */
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
const MIN_REM = 2.75;

/** Dernière déclaration (la cascade gagne) d'une propriété pour un sélecteur exact. */
function lastValue(selector: string, property: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blocks = [...css.matchAll(new RegExp(`(?:^|[},])\\s*${escaped}\\s*\\{([^}]*)\\}`, 'gm'))];
  let value: string | null = null;
  for (const block of blocks) {
    const decl = [...block[1]!.matchAll(new RegExp(`(?:^|;|\\s)${property}\\s*:\\s*([^;]+)`, 'g'))].at(-1);
    if (decl) value = decl[1]!.trim();
  }
  return value;
}

function remOf(value: string | null): number {
  if (!value) return 0;
  const rem = value.match(/^([\d.]+)rem$/);
  if (rem) return Number(rem[1]);
  const px = value.match(/^([\d.]+)px$/);
  return px ? Number(px[1]) / 16 : 0;
}

function minSize(selector: string, axis: 'width' | 'height'): number {
  return Math.max(remOf(lastValue(selector, axis)), remOf(lastValue(selector, `min-${axis}`)));
}

describe('cibles tactiles du scoreur et des presets (≥ 44 px)', () => {
  for (const selector of [
    '.match-step',
    '.match-ferme-step',
    '.match-size-compact .match-step',
    '.match-size-compact .match-ferme-step',
  ]) {
    it(selector, () => {
      expect(minSize(selector, 'width'), `${selector} largeur`).toBeGreaterThanOrEqual(MIN_REM);
      expect(minSize(selector, 'height'), `${selector} hauteur`).toBeGreaterThanOrEqual(MIN_REM);
    });
  }

  it('.preset-mini', () => {
    expect(minSize('.preset-mini', 'height')).toBeGreaterThanOrEqual(MIN_REM);
  });

  it('the white ball (tap to flip the breaker) has a 44 px hit area', () => {
    expect(minSize('button.match-ball', 'width')).toBeGreaterThanOrEqual(MIN_REM);
    expect(minSize('button.match-ball', 'height')).toBeGreaterThanOrEqual(MIN_REM);
  });
});
