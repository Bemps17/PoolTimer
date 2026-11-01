import { describe, expect, it } from 'vitest';
import {
  breakerAfterScoreDelta,
  createMatch,
  getDefaultMatchOptions,
  isVictory,
  matchWinner,
  mergeMatch,
  mergeMatchOptions,
  resetMatch,
  setFirstBreaker,
  skipLag,
  toggleBreaker,
  undo,
  updateFerme,
  updateScore,
  MATCH_LIMITS,
  MATCH_UNDO_LIMIT,
} from './match';

const noLag = { lagAtStart: false };

describe('scoreur 1v1', () => {
  it('starts at 0-0 with player 1 breaking', () => {
    const m = createMatch(noLag);
    expect(m.scores).toEqual({ 1: 0, 2: 0 });
    expect(m.fermes).toEqual({ 1: 0, 2: 0 });
    expect(m.breaker).toBe(1);
    expect(m.lagPending).toBe(false);
  });

  it('alternates the breaker on every point scored, not on a correction', () => {
    expect(breakerAfterScoreDelta(1, 1)).toBe(2);
    expect(breakerAfterScoreDelta(2, 1)).toBe(1);
    expect(breakerAfterScoreDelta(1, -1)).toBe(1);

    let m = createMatch(noLag);
    m = updateScore(m, 2, 1);
    expect(m.breaker).toBe(2);
    m = updateScore(m, 1, 1);
    expect(m.breaker).toBe(1);
    m = updateScore(m, 1, -1);
    expect(m.scores[1]).toBe(0);
    expect(m.breaker).toBe(1);
  });

  it('never goes below zero or above the limit', () => {
    const m = createMatch(noLag);
    expect(updateScore(m, 1, -1)).toBe(m);
    expect(updateFerme(m, 2, -1)).toBe(m);
    const max = { ...m, scores: { 1: MATCH_LIMITS.score.max, 2: 0 } };
    expect(updateScore(max, 1, 1)).toBe(max);
  });

  it('keeps score and casses fermes (F) strictly independent', () => {
    let m = createMatch(noLag);
    m = updateFerme(m, 1, 1);
    expect(m.fermes[1]).toBe(1);
    expect(m.scores[1]).toBe(0);
    expect(m.breaker).toBe(1);
    m = updateScore(m, 1, 1);
    expect(m.scores[1]).toBe(1);
    expect(m.fermes[1]).toBe(1);
    m = updateFerme(m, 1, -1);
    expect(m.fermes[1]).toBe(0);
    expect(m.scores[1]).toBe(1);
  });

  it('toggles the breaker manually (tap on the white ball)', () => {
    const m = toggleBreaker(createMatch(noLag));
    expect(m.breaker).toBe(2);
    expect(toggleBreaker(m).breaker).toBe(1);
  });

  it('arms the lag at match start only, then alternation takes over', () => {
    let m = createMatch({ lagAtStart: true });
    expect(m.lagPending).toBe(true);
    m = setFirstBreaker(m, 2);
    expect(m.breaker).toBe(2);
    expect(m.lagPending).toBe(false);
    m = updateScore(m, 2, 1);
    expect(m.breaker).toBe(1);
    expect(m.lagPending).toBe(false);
  });

  it('can skip the lag and keeps the current breaker', () => {
    const m = skipLag(createMatch({ lagAtStart: true }));
    expect(m.lagPending).toBe(false);
    expect(m.breaker).toBe(1);
    expect(skipLag(m)).toBe(m);
  });

  it('undo restores score, F, breaker and lag state', () => {
    let m = createMatch({ lagAtStart: true });
    m = setFirstBreaker(m, 2);
    m = updateScore(m, 2, 1);
    m = updateFerme(m, 2, 1);
    m = undo(m);
    expect(m.fermes[2]).toBe(0);
    expect(m.scores[2]).toBe(1);
    m = undo(m);
    expect(m.scores[2]).toBe(0);
    expect(m.breaker).toBe(2);
    m = undo(m);
    expect(m.lagPending).toBe(true);
    expect(m.breaker).toBe(1);
    expect(undo(m)).toBe(m);
  });

  it('caps the undo history', () => {
    let m = createMatch(noLag);
    for (let i = 0; i < MATCH_UNDO_LIMIT + 20; i += 1) m = updateFerme(m, 1, i % 2 === 0 ? 1 : -1);
    expect(m.history.length).toBe(MATCH_UNDO_LIMIT);
  });

  it('resets everything and re-arms the lag when the option is on', () => {
    expect(resetMatch({ lagAtStart: true }).lagPending).toBe(true);
    expect(resetMatch(noLag).lagPending).toBe(false);
  });

  it('detects victory only when a target is set', () => {
    expect(isVictory(5, 0)).toBe(false);
    expect(isVictory(6, 7)).toBe(false);
    expect(isVictory(7, 7)).toBe(true);
    expect(matchWinner({ scores: { 1: 7, 2: 3 } }, 7)).toBe(1);
    expect(matchWinner({ scores: { 1: 3, 2: 7 } }, 7)).toBe(2);
    expect(matchWinner({ scores: { 1: 3, 2: 4 } }, 7)).toBeNull();
    expect(matchWinner({ scores: { 1: 9, 2: 9 } }, 0)).toBeNull();
  });
});

describe('validation des données stockées', () => {
  it('falls back on garbage', () => {
    expect(mergeMatch(null, noLag).scores).toEqual({ 1: 0, 2: 0 });
    expect(mergeMatch('x', noLag).breaker).toBe(1);
    expect(mergeMatchOptions(42)).toEqual(getDefaultMatchOptions());
  });

  it('clamps and sanitizes values', () => {
    const m = mergeMatch(
      {
        scores: { 1: -5, 2: 1e9 },
        fermes: { 1: '3', 2: 'nope' },
        breaker: 7,
        lagPending: 'yes',
        history: [{ scores: { 1: 'a' } }, 'junk', ...Array.from({ length: 200 }, () => ({}))],
      },
      noLag,
    );
    expect(m.scores).toEqual({ 1: 0, 2: MATCH_LIMITS.score.max });
    expect(m.fermes).toEqual({ 1: 3, 2: 0 });
    expect(m.breaker).toBe(1);
    expect(m.lagPending).toBe(false);
    expect(m.history.length).toBeLessThanOrEqual(MATCH_UNDO_LIMIT);
  });

  it('sanitizes options', () => {
    const o = mergeMatchOptions({ enabled: false, lagAtStart: true, targetScore: 9999, showFerme: 'x', showBreaker: false });
    expect(o).toEqual({ enabled: false, lagAtStart: true, targetScore: 500, showFerme: true, showBreaker: false });
  });
});
