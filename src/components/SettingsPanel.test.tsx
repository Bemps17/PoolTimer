// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultConfig } from '../timer/config';
import type { TimerConfig } from '../timer/types';
import { SettingsPanel } from './SettingsPanel';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

function renderPanel(config: TimerConfig = getDefaultConfig(), onChange = vi.fn()) {
  const noop = vi.fn();
  render(
    <SettingsPanel
      open
      config={config}
      isFullscreen={false}
      onClose={noop}
      onChange={onChange}
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
  return onChange;
}

const cards = () => [...document.querySelectorAll('.settings-card-title')].map((node) => node.textContent);
const openTab = (name: string) => fireEvent.click(screen.getByRole('tab', { name }));

describe('menu ⚙️ : 5 onglets, une fonction par onglet', () => {
  it('has short, distinct tabs and opens on Match', () => {
    renderPanel();
    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab');
    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual(['Match', 'Affichage', 'Apparence', 'Son', 'Plus']);
    expect(screen.getByRole('tab', { name: 'Match' }).getAttribute('aria-selected')).toBe('true');
    expect(cards()).toEqual(['Joueurs', 'Chrono', 'Score']);
  });

  it('remembers the last tab', () => {
    renderPanel();
    openTab('Son');
    cleanup();
    renderPanel();
    expect(screen.getByRole('tab', { name: 'Son' }).getAttribute('aria-selected')).toBe('true');
  });

  it('Affichage = interface mode, separated from colours', () => {
    const onChange = renderPanel();
    openTab('Affichage');
    expect(cards()).toEqual(['Mode d’interface', 'Écran distant']);
    expect(screen.queryByText(/Personnaliser les couleurs/)).toBeNull();
    const visible = screen.getByRole('radio', { name: 'Boutons visibles' });
    expect(visible.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'Boutons invisibles' }));
    expect(onChange.mock.calls.at(-1)![0].modeInterface).toBe('tactile');
  });

  it('Apparence = theme and colours only, colour editor folded by default', () => {
    renderPanel();
    openTab('Apparence');
    expect(cards()).toEqual(['Thème', 'Mes thèmes']);
    expect(screen.queryByRole('radio', { name: 'Boutons invisibles' })).toBeNull();
    const details = screen.getByText('Personnaliser les couleurs').closest('details')!;
    expect(details.open).toBe(false);
  });

  it('Son groups volume, alerts and vibration', () => {
    renderPanel();
    openTab('Son');
    expect(cards()).toEqual(['Volume', 'Alertes & vibration']);
    expect(screen.getByRole('switch', { name: 'Vibration' })).toBeTruthy();
  });

  it('Plus groups connection, streaming, diagnostics, sharing and app', () => {
    renderPanel();
    openTab('Plus');
    expect(cards()).toEqual(['Miroir télécommande', 'Streaming (OBS / Streamlabs)', 'Diagnostic', 'Partage & import', 'Application']);
  });
});

describe('Score : un interrupteur, options seulement si activé', () => {
  it('shows only the master switch when the score is off', () => {
    const onChange = renderPanel();
    const master = screen.getByRole('switch', { name: 'Afficher le score' });
    expect(master.getAttribute('aria-checked')).toBe('false');
    expect(screen.queryByRole('switch', { name: 'Casses fermes (F)' })).toBeNull();
    fireEvent.click(master);
    expect(onChange.mock.calls.at(-1)![0].matchOptions.enabled).toBe(true);
  });

  it('reveals its options once enabled, as switches and segmented choices', () => {
    const base = getDefaultConfig();
    const onChange = renderPanel({ ...base, matchOptions: { ...base.matchOptions, enabled: true } });
    for (const name of ['Casses fermes (F)', 'Blanche (qui casse)', 'Tirage à la bande au début du match', 'Marquer une manche relance le chrono']) {
      expect(screen.getByRole('switch', { name })).toBeTruthy();
    }
    fireEvent.click(screen.getByRole('switch', { name: 'Casses fermes (F)' }));
    expect(onChange.mock.calls.at(-1)![0].matchOptions.showFerme).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Équipes' }));
    expect(onChange.mock.calls.at(-1)![0].matchOptions.sides).toBe('teams');
  });
});

describe('Chrono : l’essentiel visible, l’avancé replié', () => {
  it('keeps thresholds and automation inside "Réglages avancés"', () => {
    renderPanel();
    const advanced = screen.getByText('Réglages avancés').closest('details')!;
    expect(advanced.open).toBe(false);
    expect(within(advanced).getAllByLabelText(/Seuil alerte orange/i).length).toBeGreaterThan(0);
    expect(within(advanced).getByRole('switch', { name: 'Redémarrage auto après nouveau coup' })).toBeTruthy();
  });
});
