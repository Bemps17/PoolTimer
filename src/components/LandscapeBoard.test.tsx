// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { getDefaultConfig } from '../timer/config';
import { createInitialState } from '../timer/engine';
import type { MirrorMatch } from '../mirror/protocol';
import type { EngineState, TimerConfig } from '../timer/types';
import { HOLD_TO_CONFIRM_MS } from './HoldButton';
import { LandscapeBoard } from './LandscapeBoard';

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
  showBreaker: true,
};

function setup(
  overrides: {
    config?: Partial<TimerConfig>;
    state?: Partial<EngineState>;
    match?: MirrorMatch;
    remote?: boolean;
    scoreOnSides?: boolean;
  } = {},
) {
  const config = { ...getDefaultConfig(), p1Name: 'Puilboreau', p2Name: 'Delacroix', ...overrides.config };
  const state = { ...createInitialState(config), remainingTime: 38_000, ...overrides.state };
  const actions = {
    onTogglePlayPause: vi.fn(),
    onResetShot: vi.fn(),
    onApresCasse: vi.fn(),
    onExtension: vi.fn(),
    onNewGame: vi.fn(),
    onSelectPlayer: vi.fn(),
    onToggleMenu: vi.fn(),
    onScore: vi.fn(),
  };
  const view = render(
    <LandscapeBoard
      config={config}
      state={state}
      match={overrides.match}
      remoteLevel={overrides.remote ? 'ok' : undefined}
      scoreOnSides={overrides.scoreOnSides ?? true}
      menuOpen={false}
      {...actions}
    />,
  );
  return { ...view, actions };
}

describe('LandscapeBoard — paysage : joueur 1 à gauche, chrono au centre, joueur 2 à droite', () => {
  it('places player 1, the timer and player 2 in this order', () => {
    const { container } = setup();
    const order = [...container.querySelectorAll('[data-zone]')].map((el) => el.getAttribute('data-zone'));
    expect(order).toEqual(['p1', 'center', 'p2']);
    expect(container.querySelector('[data-zone="p1"]')?.textContent).toContain('Puilboreau');
    expect(container.querySelector('[data-zone="p2"]')?.textContent).toContain('Delacroix');
    expect(container.querySelector('[data-zone="center"]')?.textContent).toContain('38');
  });

  it('tapping a side gives the turn to that player', () => {
    const { actions } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Delacroix/ }));
    expect(actions.onSelectPlayer).toHaveBeenCalledWith(2);
  });

  it('score off: names only, no score nor +/-', () => {
    setup();
    expect(screen.queryByLabelText(/Ajouter une manche/)).toBeNull();
    expect(screen.queryByLabelText(/^Score /)).toBeNull();
  });

  it('score on: each side shows its score, F and +/- buttons', () => {
    const { actions } = setup({ config: { matchOptions: { ...getDefaultConfig().matchOptions, enabled: true } }, match });
    expect(screen.getByLabelText('Score Puilboreau').textContent).toBe('3');
    expect(screen.getByLabelText('Score Delacroix').textContent).toBe('2');
    expect(screen.getByLabelText('Casses fermes Puilboreau').textContent).toContain('1');
    fireEvent.click(screen.getByLabelText('Ajouter une manche à Delacroix'));
    fireEvent.click(screen.getByLabelText('Retirer une manche à Puilboreau'));
    expect(actions.onScore).toHaveBeenNthCalledWith(1, 2, 1);
    expect(actions.onScore).toHaveBeenNthCalledWith(2, 1, -1);
    expect(actions.onSelectPlayer).not.toHaveBeenCalled();
  });

  it('shows who breaks when the cue ball option is on', () => {
    setup({ config: { matchOptions: { ...getDefaultConfig().matchOptions, enabled: true } }, match });
    expect(screen.getByRole('img', { name: 'Puilboreau casse' })).toBeTruthy();
  });

  it('central actions: start/pause, new shot, extension, settings', () => {
    const { actions } = setup({ state: { isRunning: true } });
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nouveau coup' }));
    fireEvent.click(screen.getByRole('button', { name: /^Extension/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    expect(actions.onTogglePlayPause).toHaveBeenCalledTimes(1);
    expect(actions.onResetShot).toHaveBeenCalledTimes(1);
    expect(actions.onExtension).toHaveBeenCalledTimes(1);
    expect(actions.onToggleMenu).toHaveBeenCalledTimes(1);
  });

  it('new frame needs a long press', () => {
    vi.useFakeTimers();
    const { actions } = setup();
    const button = screen.getByRole('button', { name: /Nouvelle manche/ });
    fireEvent.pointerDown(button, { button: 0 });
    act(() => vi.advanceTimersByTime(HOLD_TO_CONFIRM_MS));
    expect(actions.onNewGame).toHaveBeenCalledTimes(1);
  });

  it('in remote mode, the centre is the live preview of the remote screen with its dot', () => {
    setup({ remote: true });
    expect(screen.getByRole('group', { name: 'Aperçu de l’écran distant' }).textContent).toContain('38');
    expect(screen.getByRole('img', { name: /Synchronisation OK/ })).toBeTruthy();
  });

  it('score hidden on the phone: sides show names only, the remote preview keeps the score', () => {
    const { container } = setup({ match, remote: true, scoreOnSides: false });
    expect(screen.queryByLabelText('Score Puilboreau')).toBeNull();
    expect(screen.queryByLabelText(/Ajouter une manche/)).toBeNull();
    expect(container.querySelector('.remote-preview-score')?.textContent).toMatch(/3/);
  });

  it('without a room there is no sync dot', () => {
    setup();
    expect(screen.queryByRole('img', { name: /Synchronisation/ })).toBeNull();
  });
});
