import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(relative: string): string {
  return readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('settings layout', () => {
  it('groups related settings into collapsible sections', () => {
    const panel = source('components/SettingsPanel.tsx');
    expect(panel).toContain('title="Joueurs"');
    expect(panel).toContain('title="Compétition & temps"');
    expect(panel).toContain('title="Apparence"');
    expect(panel).toContain('title="Sons & vibration"');
    expect(panel).toContain('title="Automatisation"');
    expect(panel).toContain('title="Miroir télécommande"');
    expect(panel).toContain('title="Application"');
    expect(panel).toContain('<SoundLibrarySettings');
    expect(panel).toContain('htmlId="themeVisuel"');
    expect(panel).toContain('<ThemeColorEditor');
    expect(panel).toContain('Réinitialiser les couleurs du thème');
    expect(panel).toContain('htmlId="volumeSonore"');
  });

  it('keeps a single Tutoriel button in the settings drawer', () => {
    const panel = source('components/SettingsPanel.tsx');
    const mirror = source('components/MirrorSettings.tsx');
    const labeled = panel.match(/header-tutorial-btn[\s\S]*?>\s*Tutoriel\s*</g) ?? [];
    expect(labeled).toHaveLength(1);
    expect(panel).toContain('header-tutorial-btn');
    expect(mirror).not.toMatch(/<button[^>]*>\s*Tutoriel\s*</);
    expect(mirror).not.toContain('onShowTutorial');
    const help = source('components/HelpPanel.tsx');
    expect(help).not.toMatch(/<button[^>]*>\s*Tutoriel\s*</);
    expect(help).not.toContain('onShowTutorial');
  });
});

describe('PWA tutorial assets', () => {
  it('denylists tutorial and static files from the navigate fallback', () => {
    const vite = source('../vite.config.ts');
    expect(vite).toMatch(/navigateFallbackDenylist/);
    expect(vite).toMatch(/tutorial/);
  });
});

describe('PWA update banner layout', () => {
  it('wraps Plus tard under Mettre à jour on a phone-sized viewport', () => {
    const css = source('index.css');
    expect(css).toMatch(/\.update-banner[\s\S]*flex-wrap:\s*wrap/);
    expect(css).toMatch(/\.update-banner-actions[\s\S]*flex-wrap:\s*wrap/);
    expect(css).toMatch(/@media \(max-width: 430px\)[\s\S]*\.update-banner-actions[\s\S]*flex-direction:\s*column/);
    expect(css).toMatch(/@media \(max-width: 430px\)[\s\S]*\.update-banner-later[\s\S]*width:\s*100%/);
  });
});
