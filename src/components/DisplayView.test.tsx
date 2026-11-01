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
