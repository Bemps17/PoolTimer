// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MatchEndDialog } from './MatchEndDialog';

afterEach(cleanup);

const summary = 'Dupont 7 – 4 Martin\ncourse à 7 · 11 manches · 54 min\nCasses fermes : 2 – 0';

describe('MatchEndDialog', () => {
  it('announces the winner and shows the shareable summary', () => {
    render(<MatchEndDialog winnerName="Dupont" summary={summary} onShare={vi.fn()} onNewMatch={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: /Victoire de Dupont/ })).toBeTruthy();
    expect(screen.getByText(/11 manches/)).toBeTruthy();
  });

  it('offers share, new match and close (keep correcting the score)', () => {
    const onShare = vi.fn();
    const onNewMatch = vi.fn();
    const onClose = vi.fn();
    render(<MatchEndDialog winnerName="Dupont" summary={summary} onShare={onShare} onNewMatch={onNewMatch} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Partager le résultat/ }));
    fireEvent.click(screen.getByRole('button', { name: /Nouveau match/ }));
    fireEvent.click(screen.getByRole('button', { name: /Fermer/ }));
    expect(onShare).toHaveBeenCalledWith(summary);
    expect(onNewMatch).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
