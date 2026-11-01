// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MirrorMatch } from '../mirror/protocol';
import { MatchScore } from './MatchScore';
import { LagPrompt } from './LagPrompt';

afterEach(cleanup);

const match: MirrorMatch = {
  scores: { 1: 3, 2: 1 },
  fermes: { 1: 0, 2: 2 },
  breaker: 2,
  lagPending: false,
  targetScore: 0,
  showFerme: true,
  showBreaker: true,
};
const base = { p1Name: 'Dupont', p2Name: 'Martin', p1Color: '#3498db', p2Color: '#e74c3c' };

function controls() {
  return { onScore: vi.fn(), onFerme: vi.fn(), onToggleBreaker: vi.fn(), onUndo: vi.fn(), canUndo: true };
}

describe('MatchScore (télécommande)', () => {
  it('shows score and F as two separate counters', () => {
    render(<MatchScore match={match} {...base} controls={controls()} />);
    expect(screen.getByLabelText('Score Dupont').textContent).toBe('3');
    expect(screen.getByLabelText('Casses fermes Martin').textContent).toMatch(/F\s*2/);
  });

  it('routes + / − on score and on F to different handlers', () => {
    const c = controls();
    render(<MatchScore match={match} {...base} controls={c} />);
    fireEvent.click(screen.getByLabelText('Ajouter une manche à Dupont'));
    fireEvent.click(screen.getByLabelText('Retirer une manche à Martin'));
    fireEvent.click(screen.getByLabelText('Ajouter une casse ferme à Dupont'));
    expect(c.onScore).toHaveBeenNthCalledWith(1, 1, 1);
    expect(c.onScore).toHaveBeenNthCalledWith(2, 2, -1);
    expect(c.onFerme).toHaveBeenCalledWith(1, 1);
    expect(c.onScore).toHaveBeenCalledTimes(2);
  });

  it('marks who breaks (white ball) and lets the referee flip it', () => {
    const c = controls();
    render(<MatchScore match={match} {...base} controls={c} />);
    expect(screen.getByLabelText(/Martin casse/).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByLabelText('Donner la casse à Dupont'));
    expect(c.onToggleBreaker).toHaveBeenCalledTimes(1);
  });

  it('hides F and the ball when disabled, announces a winner', () => {
    render(
      <MatchScore
        match={{ ...match, showFerme: false, showBreaker: false, targetScore: 3 }}
        {...base}
        controls={controls()}
      />,
    );
    expect(screen.queryByLabelText(/Casses fermes/)).toBeNull();
    expect(screen.queryByLabelText(/casse \(/)).toBeNull();
    expect(screen.getByText('VICTOIRE')).toBeTruthy();
  });
});

describe('MatchScore (écran Visuel, lecture seule)', () => {
  it('has no control at all, shows the lag notice while the draw is pending', () => {
    render(<MatchScore match={{ ...match, lagPending: true }} {...base} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByRole('status').textContent).toMatch(/Tirage à la bande/);
  });
});

describe('LagPrompt', () => {
  it('lets the referee pick the lag winner or skip', () => {
    const onChoose = vi.fn();
    const onSkip = vi.fn();
    render(<LagPrompt {...base} onChoose={onChoose} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: 'Martin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Passer' }));
    expect(onChoose).toHaveBeenCalledWith(2);
    expect(onSkip).toHaveBeenCalled();
  });
});
