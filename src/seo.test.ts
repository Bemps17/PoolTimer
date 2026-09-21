import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const TITLE = 'H8timer — Chronomètre billard avec télécommande et écran miroir';
const DESCRIPTION =
  'Contrôle à distance du shot clock : télécommande sur un téléphone, écran Visuel en miroir pour le public. Chronomètre billard / Blackball FFB — H8timer.';
const CANONICAL = 'https://pooltimer.vercel.app/';

describe('on-page SEO', () => {
  const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
  const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
  const vercel = readFileSync(new URL('../vercel.json', import.meta.url), 'utf8');

  it('exposes French crawlable meta in index.html (not only client-side)', () => {
    expect(indexHtml).toMatch(/<html lang="fr">/);
    expect(indexHtml).toContain(`<title>${TITLE}</title>`);
    expect(indexHtml).toContain(`content="${DESCRIPTION}"`);
    expect(indexHtml).toContain(`href="${CANONICAL}"`);
    expect(indexHtml).toContain('rel="canonical"');
    expect(indexHtml).toContain(`<meta property="og:title" content="${TITLE}" />`);
    expect(indexHtml).toContain('property="og:description"');
    expect(indexHtml).toContain('property="og:image" content="https://pooltimer.vercel.app/og-image.png"');
    expect(indexHtml).toContain('name="twitter:card" content="summary_large_image"');
    expect(indexHtml).toContain('name="twitter:title"');
    expect(indexHtml).toContain('type="application/ld+json"');
    expect(indexHtml).toContain('"@type": "WebApplication"');
    expect(indexHtml).toContain('télécommande');
    expect(indexHtml).toContain('<noscript>');
    expect(DESCRIPTION.length).toBeGreaterThan(110);
    expect(DESCRIPTION.length).toBeLessThan(170);
  });

  it('keeps keywords focused without stuffing', () => {
    const match = indexHtml.match(/name="keywords"\s+content="([^"]+)"/);
    expect(match?.[1]).toBeTruthy();
    const keywords = match![1].split(',').map((part) => part.trim());
    expect(keywords).toEqual([
      'timer billard',
      'chronomètre blackball',
      'shot clock FFB',
      'télécommande',
      'écran miroir',
      'H8timer',
      'chronomètre de tir',
      'PoolTimer',
    ]);
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it('ships robots.txt, sitemap.xml and keeps them out of the SPA fallback', () => {
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /d/');
    expect(robots).toContain('Sitemap: https://pooltimer.vercel.app/sitemap.xml');
    expect(sitemap).toContain('<loc>https://pooltimer.vercel.app/</loc>');
    expect(viteConfig).toMatch(/navigateFallbackDenylist[\s\S]*robots\\.txt/);
    expect(viteConfig).toMatch(/navigateFallbackDenylist[\s\S]*sitemap\\.xml/);
    expect(vercel).toContain('robots');
    expect(vercel).toContain('sitemap');
  });

  it('aligns the PWA manifest description with the remote-control feature', () => {
    expect(viteConfig).toContain("name: 'H8timer'");
    expect(viteConfig).toContain("short_name: 'H8timer'");
    expect(viteConfig).toMatch(/description:\s*'[^']*télécommande[^']*écran Visuel[^']*'/);
    expect(viteConfig).toContain("'og-image.png'");
  });
});
