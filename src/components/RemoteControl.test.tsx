// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { getDefaultConfig } from '../timer/config';
import { createInitialState } from '../timer/engine';
import type { MirrorMatch } from '../mirror/protocol';
import type { EngineState, TimerConfig } from '../timer/types';
import { HOLD_TO_CONFIRM_MS } from './HoldButton';
import { RemoteControl } from './RemoteControl';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const match: MirrorMatch = {
  scores: { 1: 3, 2: 2 },
  fermes: { 1: 1, 2: 0 },
  breaker: 1,
  lagPending: false,
  targetScore: 7,
  showFerme: true,
  showBreaker: false,
};

function setup(overrides: { config?: Partial<TimerConfig>; state?: Partial<EngineState>; match?: MirrorMatch } = {}) {
  const config = { ...getDefaultConfig(), p1Name: 'Puilboreau', p2Name: 'Delacroix', ...overrides.config };
  const state = { ...createInitialState(config), ...overrides.state };
  const actions = {
    onTogglePlayPause: vi.fn(),
    onResetShot: vi.fn(),
    onApresCasse: vi.fn(),
    onExtension: vi.fn(),
    onNewGame: vi.fn(),
    onSelectPlayer: vi.fn(),
    onToggleMenu: vi.fn(),
  };
  const view = render(
    <RemoteControl config={config} state={state} match={overrides.match} level="ok" menuOpen={false} {...actions} />,
  );
  return { ...view, actions, config };
}

describe('RemoteControl — télécommande dédiée (portrait)', () => {
  it('shows a live preview of the remote screen: dot, players and the same digits', () => {
    setup({ state: { remainingTime: 38_000 } });
    const preview = screen.getByRole('group', { name: 'Aperçu de l’écran distant' });
    expect(preview.textContent).toContain('38');
    expect(preview.textContent).toContain('Puilboreau');
    expect(preview.textContent).toContain('Delacroix');
    expect(screen.getByRole('img', { name: /Synchronisation OK/ })).toBeTruthy();
  });

  it('preview shows the score only when the remote screen shows it, without any +/- on the main screen', () => {
    const { container } = setup({ config: { matchOptions: { ...getDefaultConfig().matchOptions, enabled: true } }, match });
    const preview = screen.getByRole('group', { name: 'Aperçu de l’écran distant' });
    expect(preview.querySelector('.remote-preview-score')?.textContent).toMatch(/3/);
    expect(screen.queryByLabelText(/Ajouter une manche/)).toBeNull();
    expect(container.querySelector('.match-bar')).toBeNull();
  });

  it('no score in the preview when the score is off', () => {
    setup();
    const preview = screen.getByRole('group', { name: 'Aperçu de l’écran distant' });
    expect(preview.querySelector('.remote-preview-score')).toBeNull();
  });

  it('big start / pause button drives the timer', () => {
    const { actions } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
    expect(actions.onTogglePlayPause).toHaveBeenCalledTimes(1);
  });

  it('labels the big button Pause while running', () => {
    setup({ state: { isRunning: true } });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  });

  it('shot actions: new shot, extension, after break', () => {
    const { actions } = setup({ config: { tempsApresCasse: 90, tempsBase: 45 }, state: { isRunning: true } });
    fireEvent.click(screen.getByRole('button', { name: 'Nouveau coup' }));
    fireEvent.click(screen.getByRole('button', { name: /^Extension \+15/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Après casse/ }));
    expect(actions.onResetShot).toHaveBeenCalledTimes(1);
    expect(actions.onExtension).toHaveBeenCalledTimes(1);
    expect(actions.onApresCasse).toHaveBeenCalledTimes(1);
  });

  it('extension already used: button disabled, nothing happens', () => {
    const { actions } = setup({ state: { isRunning: true, extensionsUsedInGame: { 1: true, 2: false } } });
    const ext = screen.getByRole('button', { name: /^Extension/ });
    expect(ext.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(ext);
    expect(actions.onExtension).not.toHaveBeenCalled();
  });

  it('players: tapping a name gives the turn', () => {
    const { actions } = setup();
    fireEvent.click(screen.getAllByRole('button', { name: /Delacroix/ })[0]);
    expect(actions.onSelectPlayer).toHaveBeenCalledWith(2);
  });

  it('new frame needs a long press (no accidental reset)', () => {
    vi.useFakeTimers();
    const { actions } = setup();
    const button = screen.getByRole('button', { name: /Nouvelle manche/ });
    fireEvent.pointerDown(button, { button: 0 });
    act(() => vi.advanceTimersByTime(HOLD_TO_CONFIRM_MS / 2));
    fireEvent.pointerUp(button);
    expect(actions.onNewGame).not.toHaveBeenCalled();
    fireEvent.pointerDown(button, { button: 0 });
    act(() => vi.advanceTimersByTime(HOLD_TO_CONFIRM_MS));
    expect(actions.onNewGame).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(button);
    expect(actions.onNewGame).toHaveBeenCalledTimes(1);
  });

  it('new frame from the keyboard (accessibility) stays possible', () => {
    const { actions } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Nouvelle manche/ }), { detail: 0 });
    expect(actions.onNewGame).toHaveBeenCalledTimes(1);
  });

  it('settings button keeps its accessible name', () => {
    const { actions } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    expect(actions.onToggleMenu).toHaveBeenCalledTimes(1);
  });

  it('no status text on the remote, only the dot', () => {
    const { container } = setup();
    expect(container.textContent).not.toMatch(/Miroir|attente|Sync|connect/i);
  });
});
