import { describe, expect, it } from 'vitest';
import { getDefaultConfig } from './config';
import { createInitialState, newGame, startTimer, useExtension } from './engine';
import {
  createMatch,
  getDefaultMatchOptions,
  matchSummary,
  mergeMatch,
  mergeMatchOptions,
  undo,
  updateFerme,
  updateScore,
} from './match';
import { displayPlayerName, sideLabel } from './playerName';

describe('nouvelle manche du chrono = joueur qui casse', () => {
  it('newGame can start with the next breaker, extensions reset', () => {
    const config = getDefaultConfig();
    let state = startTimer(createInitialState(config), 0);
    state = useExtension(state, config, 1_000);
    const next = newGame(state, config, 2);
    expect(next.currentPlayer).toBe(2);
    expect(next.extensionsUsedInGame).toEqual({ 1: false, 2: false });
    expect(next.isRunning).toBe(false);
    expect(newGame(state, config).currentPlayer).toBe(1); // comportement historique conservé
  });

  it('marking a frame restarts the shot clock by default (option)', () => {
    expect(getDefaultMatchOptions().frameRestartsTimer).toBe(true);
    expect(mergeMatchOptions({ frameRestartsTimer: false }).frameRestartsTimer).toBe(false);
  });
});

describe('historique des manches', () => {
  it('records who won each frame, who broke, and when', () => {
    let m = createMatch({ lagAtStart: false });
    m = updateScore(m, 2, 1, 1_000);
    m = updateScore(m, 1, 1, 61_000);
    expect(m.frames).toEqual([
      { winner: 2, breaker: 1, at: 1_000 },
      { winner: 1, breaker: 2, at: 61_000 },
    ]);
  });

  it('a −1 removes that side’s last frame; F never touches the history', () => {
    let m = createMatch({ lagAtStart: false });
    m = updateScore(m, 1, 1, 1);
    m = updateScore(m, 2, 1, 2);
    m = updateScore(m, 1, 1, 3);
    m = updateFerme(m, 1, 1);
    m = updateScore(m, 1, -1, 4);
    expect(m.frames.map((f) => f.winner)).toEqual([1, 2]);
  });

  it('undo restores the history too, and storage validates it', () => {
    let m = updateScore(createMatch({ lagAtStart: false }), 1, 1, 5);
    m = undo(m);
    expect(m.frames).toEqual([]);
    const restored = mergeMatch(
      { scores: { 1: 1, 2: 0 }, frames: [{ winner: 1, breaker: 1, at: 5 }, { winner: 9 }, 'x', { winner: 2, breaker: 1, at: 'z' }] },
      { lagAtStart: false },
    );
    expect(restored.frames).toEqual([{ winner: 1, breaker: 1, at: 5 }]);
  });
});

describe('résumé de fin de match (texte à partager)', () => {
  it('gives score, race, F, frames and duration', () => {
    let m = createMatch({ lagAtStart: false });
    m = updateScore(m, 1, 1, 0);
    m = updateFerme(m, 1, 1);
    m = updateScore(m, 2, 1, 600_000);
    m = updateScore(m, 1, 1, 3_240_000);
    const text = matchSummary(m, { p1: 'Dupont', p2: 'Martin', targetScore: 2 });
    expect(text).toContain('Dupont 2 – 1 Martin');
    expect(text).toContain('course à 2');
    expect(text).toContain('Casses fermes : 1 – 0');
    expect(text).toContain('3 manches');
    expect(text).toContain('54 min');
    expect(text).toContain('H8timer');
  });

  it('omits what is unknown instead of inventing it', () => {
    const text = matchSummary(createMatch({ lagAtStart: false }), { p1: '', p2: '', targetScore: 0 });
    expect(text).toContain('Joueur 1 0 – 0 Joueur 2');
    expect(text).not.toContain('course');
    expect(text).not.toContain('min');
  });
});

describe('mode équipe', () => {
  it('labels empty names as teams', () => {
    expect(sideLabel(1, 'teams')).toBe('Équipe A');
    expect(sideLabel(2, 'teams')).toBe('Équipe B');
    expect(sideLabel(2, 'players')).toBe('Joueur 2');
    expect(displayPlayerName('', 1, 'teams')).toBe('Équipe A');
    expect(displayPlayerName('Les Requins', 1, 'teams')).toBe('Les Requins');
    expect(displayPlayerName('', 2)).toBe('Joueur 2');
    expect(getDefaultMatchOptions().sides).toBe('players');
    expect(mergeMatchOptions({ sides: 'teams' }).sides).toBe('teams');
    expect(mergeMatchOptions({ sides: 'robots' }).sides).toBe('players');
  });
});
