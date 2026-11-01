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
  return { onScore: vi.fn(), onFerme: vi.fn(), onToggleBreaker: vi.fn() };
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

describe('MatchScore compact (télécommande, téléphone étroit)', () => {
  it('fits on two rows per side: − score + / ball −F F +F, with no undo button in the bar', () => {
    const { container } = render(<MatchScore match={match} {...base} size="compact" controls={controls()} />);
    const sides = container.querySelectorAll('.match-side');
    expect(sides).toHaveLength(2);
    for (const side of sides) {
      const main = side.querySelector('.match-main')!;
      const ferme = side.querySelector('.match-ferme-row')!;
      expect(main.querySelectorAll('button')).toHaveLength(2); // − et +
      expect(ferme.querySelector('.match-ball')).not.toBeNull(); // la blanche passe sur la ligne F
      expect(ferme.querySelectorAll('.match-ferme-step')).toHaveLength(2); // −F et +F
    }
    expect(screen.getAllByLabelText(/Retirer une casse ferme/)).toHaveLength(2);
    expect(screen.queryByLabelText(/Annuler/)).toBeNull();
  });

  it('keeps − F in the full layout', () => {
    render(<MatchScore match={match} {...base} size="full" controls={controls()} />);
    expect(screen.getAllByLabelText(/Retirer une casse ferme/)).toHaveLength(2);
  });
});

describe('MatchScore — pas de bouton annuler dans la barre (place pour le chrono)', () => {
  it('full layout has no undo button either', () => {
    render(<MatchScore match={match} {...base} size="full" controls={controls()} />);
    expect(screen.queryByLabelText(/Annuler/)).toBeNull();
  });
});

describe('MatchScore grand (télécommande)', () => {
  it('puts the white ball on its own row so "− score +" fits on a narrow phone', () => {
    const { container } = render(<MatchScore match={match} {...base} size="full" controls={controls()} />);
    for (const side of container.querySelectorAll('.match-side')) {
      expect(side.querySelector('.match-ball-row .match-ball')).not.toBeNull();
      expect(side.querySelector('.match-main .match-ball')).toBeNull();
    }
  });

  it('the read-only Visual screen keeps the ball next to the score', () => {
    const { container } = render(<MatchScore match={match} {...base} />);
    expect(container.querySelector('.match-main .match-ball')).not.toBeNull();
  });
});
