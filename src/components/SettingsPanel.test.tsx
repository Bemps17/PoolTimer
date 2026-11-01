// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDefaultConfig } from '../timer/config';
import { SettingsPanel } from './SettingsPanel';

afterEach(cleanup);

function renderPanel() {
  const noop = vi.fn();
  return render(
    <SettingsPanel
      open
      config={getDefaultConfig()}
      isFullscreen={false}
      onClose={noop}
      onChange={noop}
      onShowHelp={noop}
      onShowChangelog={noop}
      onShowTutorial={noop}
      onNewMatch={noop}
      onUndoMatch={noop}
      canUndoMatch={false}
      onToggleFullscreen={noop}
      installStatus="unsupported"
      onInstall={noop}
      onCheckUpdates={noop}
      presetsController={{ presets: [], create: noop, rename: noop, duplicate: noop, remove: noop }}
      themesController={{ themes: [], create: noop, rename: noop, remove: noop }}
      onNotify={noop}
      onSharePreset={noop}
      onShareTheme={noop}
      onImportEnvelope={noop}
      extraSections={<p>miroir</p>}
      streamSection={<p>stream</p>}
      diagnosticsSection={<p>diagnostic</p>}
    />,
  );
}

const sectionTitles = () =>
  [...document.querySelectorAll('.settings-section-title')].map((node) => node.textContent);

describe('menu ⚙️ en 3 onglets', () => {
  it('opens on "Match" with the match settings only', () => {
    renderPanel();
    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Match', 'Apparence', 'Appareil & partage']);
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
    expect(sectionTitles()).toEqual(['Joueurs', 'Score', 'Compétition & temps', 'Automatisation']);
  });

  it('switches to the appearance tab', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('tab', { name: 'Apparence' }));
    expect(screen.getByRole('tab', { name: 'Apparence' }).getAttribute('aria-selected')).toBe('true');
    expect(sectionTitles()).toEqual(['Apparence', 'Affichage télécommande & écran']);
  });

  it('groups device, mirror, streaming, sharing and app in the last tab', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('tab', { name: 'Appareil & partage' }));
    expect(sectionTitles()).toEqual([
      'Sons & vibration',
      'Miroir télécommande',
      'Streaming (OBS / Streamlabs)',
      'Partage & import',
      'Diagnostic',
      'Application',
    ]);
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(
      screen.getByRole('tab', { name: 'Appareil & partage' }).id,
    );
  });
});
