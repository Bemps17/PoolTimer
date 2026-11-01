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
    expect(CHANGELOG[0]?.notes.join(' ')).toMatch(/paysage/i);

    const remote = CHANGELOG.find((entry) => entry.version === '3.4.0');
    expect(remote?.notes.join(' ')).toMatch(/télécommande/i);
    expect(remote?.notes.join(' ')).toMatch(/paysage/i);

    const tabs = CHANGELOG.find((entry) => entry.version === '3.3.1');
    expect(tabs?.notes.join(' ')).toMatch(/onglets/i);
    expect(tabs?.notes.join(' ')).toMatch(/Lucide/);

    const menu = CHANGELOG.find((entry) => entry.version === '3.3.0');
    expect(menu?.notes.join(' ')).toMatch(/onglets/i);
    expect(menu?.notes.join(' ')).toMatch(/EXTENSION/);

    const light = CHANGELOG.find((entry) => entry.version === '3.2.0');
    expect(light?.notes.join(' ')).toMatch(/voyant/i);
    expect(light?.notes.join(' ')).toMatch(/diagnostic/i);

    const end = CHANGELOG.find((entry) => entry.version === '3.1.0');
    expect(end?.notes.join(' ')).toMatch(/fin de match/i);
    expect(end?.notes.join(' ')).toMatch(/équipe/i);

    const relay = CHANGELOG.find((entry) => entry.version === '3.0.1');
    expect(relay?.notes.join(' ')).toMatch(/quota/i);
    expect(relay?.notes.join(' ')).toMatch(/audibles?/i);

    const v3 = CHANGELOG.find((entry) => entry.version === '3.0.0');
    expect(v3?.notes.join(' ')).toMatch(/salle miroir persistante/i);
    expect(v3?.notes.join(' ')).toMatch(/contraste/i);

    const sharing = CHANGELOG.find((entry) => entry.version === '2.11.0');
    expect(sharing?.notes.join(' ')).toMatch(/partage/i);
    expect(sharing?.notes.join(' ')).toMatch(/écran toujours allumé/i);

    const loud = CHANGELOG.find((entry) => entry.version === '2.10.1');
    expect(loud?.notes.join(' ')).toMatch(/volume maximum|Maximum/i);
    expect(loud?.notes.join(' ')).toMatch(/limiteur/i);

    const presets = CHANGELOG.find((entry) => entry.version === '2.10.0');
    expect(presets?.notes.join(' ')).toMatch(/presets? personnalis/i);
    expect(presets?.notes.join(' ')).toMatch(/roue crantée/i);

    const streaming = CHANGELOG.find((entry) => entry.version === '2.9.0');
    expect(streaming?.notes.join(' ')).toMatch(/OBS|Streamlabs|overlay/i);
    expect(streaming?.notes.join(' ')).toMatch(/télécommande|miroir/i);

    const scoreur = CHANGELOG.find((entry) => entry.version === '2.8.0');
    expect(scoreur?.notes.join(' ')).toMatch(/score|casses? fermes?|blanche/i);

    const seo = CHANGELOG.find((entry) => entry.version === '2.7.1');
    expect(seo?.notes.join(' ')).toMatch(/SEO|référencement|sitemap|robots/i);

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
