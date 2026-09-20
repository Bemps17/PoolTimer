import { describe, expect, it } from 'vitest';
import { bundledTutorialUrl, publicAssetUrl } from './assetUrl';

describe('publicAssetUrl', () => {
  it('prefixes Vite BASE_URL and strips a leading slash on the file path', () => {
    expect(publicAssetUrl('tutorial/slide-accueil.svg', '/')).toBe('/tutorial/slide-accueil.svg');
    expect(publicAssetUrl('/tutorial/slide-accueil.svg', '/')).toBe('/tutorial/slide-accueil.svg');
    expect(publicAssetUrl('tutorial/slide-tap.svg', '/app/')).toBe('/app/tutorial/slide-tap.svg');
    expect(publicAssetUrl('/tutorial/slide-tap.svg', '/app')).toBe('/app/tutorial/slide-tap.svg');
  });
});

describe('bundledTutorialUrl', () => {
  it('resolves a real SVG next to the module (Vite import URL)', () => {
    const href = bundledTutorialUrl('slide-accueil.svg');
    expect(href).toMatch(/slide-accueil\.svg/);
  });
});
