// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { getDefaultConfig } from '../timer/config';
import { createInitialState } from '../timer/engine';
import { Scoreboard } from './Scoreboard';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);

function renderBoard(remote?: Parameters<typeof Scoreboard>[0]['remote']) {
  const config = getDefaultConfig();
  const noop = vi.fn();
  return render(
    <Scoreboard
      config={config}
      state={createInitialState(config)}
      menuOpen={false}
      onTogglePlayPause={noop}
      onResetShot={noop}
      onApresCasse={noop}
      onExtension={noop}
      onNewGame={noop}
      onSelectPlayer={noop}
      onToggleMenu={noop}
      onToggleMinions={noop}
      remote={remote}
    />,
  );
}

describe('Scoreboard — télécommande allégée', () => {
  it('shows only a coloured dot for the link, no room code or status text', () => {
    const { container } = renderBoard({ level: 'slow', scorePlacement: 'compact' });
    expect(screen.getByRole('img', { name: /latence/ })).toBeTruthy();
    expect(container.textContent).not.toMatch(/Miroir|MIROIR|attente|Sync/);
  });

  it('no dot at all without an open room', () => {
    renderBoard();
    expect(screen.queryByRole('img', { name: /Synchronisation/ })).toBeNull();
  });
});
