// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SyncDot } from './SyncDot';

afterEach(cleanup);

describe('SyncDot — un point de couleur, aucun texte', () => {
  it.each([
    ['ok', 'sync-dot-ok', /OK/],
    ['slow', 'sync-dot-slow', /latence/],
    ['down', 'sync-dot-down', /interrompue/],
  ] as const)('%s', (level, className, label) => {
    const { container } = render(<SyncDot level={level} />);
    const dot = screen.getByRole('img', { name: label });
    expect(dot.className).toContain(className);
    expect(container.textContent).toBe('');
  });

  it('can open the diagnostics when tapped', () => {
    const onOpen = vi.fn();
    render(<SyncDot level="ok" onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: /Synchronisation OK.*diagnostic/i }));
    expect(onOpen).toHaveBeenCalled();
  });
});
