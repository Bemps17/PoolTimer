import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(relative: string): string {
  return readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('settings layout', () => {
  it('organises settings by function: interface mode apart from colours, switches instead of Oui/Non lists', () => {
    const panel = source('components/SettingsPanel.tsx');
    for (const title of ['Joueurs', 'Chrono', 'Score', 'Mode d’interface', 'Écran distant', 'Thème', 'Mes thèmes', 'Volume', 'Alertes & vibration', 'Partage & import', 'Application']) {
      expect(panel).toContain(`title="${title}"`);
    }
    expect(panel).toContain('title="Personnaliser les couleurs"');
    expect(panel).toContain('title="Réglages avancés"');
    expect(panel).toContain('<SoundLibrarySettings');
    expect(panel).toContain('<ThemeColorEditor');
    expect(panel).toContain('<PresetManager');
    expect(panel).not.toContain('YES_NO');
    expect(panel).not.toContain('<SelectField');
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
