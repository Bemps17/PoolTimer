// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const toggle = vi.fn();
vi.mock('../hooks/useFullscreen', () => ({ useFullscreen: () => ({ isFullscreen: false, toggle }) }));
vi.mock('../hooks/useKeepAwake', () => ({ useKeepAwake: () => 'active' }));
vi.mock('../hooks/useMirror', async () => {
  const { getDefaultConfig } = await import('../timer/config');
  const { buildSnapshot } = await import('../mirror/protocol');
  const { createInitialState } = await import('../timer/engine');
  const config = getDefaultConfig();
  return {
    useDisplayMirror: () => ({
      snapshot: buildSnapshot(createInitialState(config), config, 0),
      remainingTime: 45_000,
      status: 'live',
      sync: { label: 'Sync OK', waitingForSnapshot: false },
      level: 'ok',
      diagnostics: () => ({ rows: [['Synchro', 'OK']], buildLog: () => 'log' }),
      clearLog: () => undefined,
    }),
  };
});

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(() => {
  cleanup();
  toggle.mockClear();
});

describe('DisplayView — plein écran', () => {
  it('a tap anywhere does NOT leave/enter fullscreen (taps keep the screen awake)', async () => {
    const { DisplayView } = await import('./DisplayView');
    render(<DisplayView room="AB3K7Q" />);
    fireEvent.click(screen.getByLabelText(/écran Visuel en miroir/));
    expect(toggle).not.toHaveBeenCalled();
  });

  it('has a dedicated, labelled fullscreen button', async () => {
    const { DisplayView } = await import('./DisplayView');
    render(<DisplayView room="AB3K7Q" />);
    fireEvent.click(screen.getByRole('button', { name: /plein écran/i }));
    expect(toggle).toHaveBeenCalledTimes(1);
  });
});

describe('DisplayView — vision allégée', () => {
  it('shows no status text, no room code, no hint: only the timer and a sync dot', async () => {
    const { DisplayView } = await import('./DisplayView');
    const { container } = render(<DisplayView room="AB3K7Q" />);
    expect(container.textContent).not.toMatch(/Miroir|AB3|Sync OK|lecture seule|Touchez/);
    expect(screen.getByRole('img', { name: /Synchronisation OK/ })).toBeTruthy();
    expect(container.querySelector('.timer-officiel')?.textContent).toBe('45');
  });

  it('opens the diagnostics when the dot is tapped', async () => {
    const { DisplayView } = await import('./DisplayView');
    render(<DisplayView room="AB3K7Q" />);
    fireEvent.click(screen.getByRole('button', { name: /diagnostic/i }));
    expect(screen.getByRole('dialog', { name: /Diagnostic/ })).toBeTruthy();
  });
});
