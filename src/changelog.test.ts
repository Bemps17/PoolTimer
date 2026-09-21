import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_VERSION, CHANGELOG } from './changelog';

describe('changelog', () => {
  it('keeps the UI version aligned with package.json and the latest notes', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    const published = JSON.parse(readFileSync(new URL('../public/version.json', import.meta.url), 'utf8')) as {
      version: string;
    };
    expect(APP_VERSION).toBe(pkg.version);
    expect(published.version).toBe(APP_VERSION);
    expect(CHANGELOG[0]?.version).toBe(APP_VERSION);
    expect(CHANGELOG[0]?.notes.length).toBeGreaterThan(0);
    expect(CHANGELOG[0]?.notes.join(' ')).toMatch(/SEO|référencement|sitemap|robots/i);
    expect(CHANGELOG[0]?.notes.join(' ')).toMatch(/télécommande|miroir/i);

    const appearance = CHANGELOG.find((entry) => entry.version === '2.7.0');
    expect(appearance?.notes.join(' ')).toMatch(/Apparence|thème|preset/i);
    expect(appearance?.notes.join(' ')).toMatch(/couleur|zone/i);

    const compact = CHANGELOG.find((entry) => entry.version === '2.6.2');
    expect(compact?.notes.join(' ')).toMatch(/Tutoriel/);
    expect(compact?.notes.join(' ')).toMatch(/BASE_URL|Vite|PWA/i);

    const restored = CHANGELOG.find((entry) => entry.version === '2.6.1');
    expect(restored?.notes.join(' ')).toMatch(/alert-time\.mp3/);
    expect(restored?.notes.join(' ')).toMatch(/minions-arghh\.mp3/);
    expect(restored?.notes.join(' ')).toMatch(/Voicemod/);
    expect(restored?.notes.join(' ')).toMatch(/Importer/);
  });
});
