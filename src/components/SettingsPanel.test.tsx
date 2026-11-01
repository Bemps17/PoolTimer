// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultConfig } from '../timer/config';
import type { TimerConfig } from '../timer/types';
import { SettingsPanel } from './SettingsPanel';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

function renderPanel(config: TimerConfig = getDefaultConfig(), onChange = vi.fn(), liveScore?: React.ReactNode) {
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
      liveScore={liveScore}
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
    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual(['Match', 'Écran', 'Thème', 'Son', 'Plus']);
    // Libellés courts (≤ 5 lettres) et icônes vectorielles, pas d'emoji : rien ne déborde sur un petit écran.
    for (const tab of tabs) {
      expect(tab.textContent!.length).toBeLessThanOrEqual(5);
      expect(tab.querySelector('svg')).not.toBeNull();
      expect(tab.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    }
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

  it('Écran = interface mode, separated from colours', () => {
    const onChange = renderPanel();
    openTab('Écran');
    expect(cards()).toEqual(['Mode d’interface', 'Écran distant']);
    expect(screen.queryByText(/Personnaliser les couleurs/)).toBeNull();
    const visible = screen.getByRole('radio', { name: 'Boutons visibles' });
    expect(visible.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'Boutons invisibles' }));
    expect(onChange.mock.calls.at(-1)![0].modeInterface).toBe('tactile');
  });

  it('Apparence = theme and colours only, colour editor folded by default', () => {
    renderPanel();
    openTab('Thème');
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

describe('Score en cours : réglé dans ⚙️ (+/−), plus sur l’écran de la télécommande', () => {
  it('puts the live score first in the Match tab when the score is on', () => {
    const base = getDefaultConfig();
    renderPanel({ ...base, matchOptions: { ...base.matchOptions, enabled: true } }, vi.fn(), <p>score en cours +/−</p>);
    expect(cards()).toEqual(['Score en cours', 'Joueurs', 'Chrono', 'Score']);
    const card = screen.getByText('Score en cours').closest('.settings-card')!;
    expect(within(card as HTMLElement).getByText('score en cours +/−')).toBeTruthy();
  });

  it('hides them when the score is off', () => {
    renderPanel(getDefaultConfig(), vi.fn(), <p>score en cours +/−</p>);
    expect(screen.queryByText('score en cours +/−')).toBeNull();
  });
});

describe('Écran : disposition paysage en option', () => {
  it('offers the landscape layout, off by default, and no more remote score choice', () => {
    const onChange = renderPanel();
    openTab('Écran');
    const landscape = screen.getByRole('switch', { name: 'Disposition paysage (téléphone tourné)' });
    expect(landscape.getAttribute('aria-checked')).toBe('false');
    expect(screen.queryByText('Score sur la télécommande')).toBeNull();
    fireEvent.click(landscape);
    expect(onChange.mock.calls.at(-1)![0].viewOptions.landscape).toBe(true);
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
