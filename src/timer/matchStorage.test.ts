import { describe, expect, it } from 'vitest';
import { createMatch, updateFerme, updateScore } from './match';
import { loadMatch, MATCH_STORAGE_KEY, saveMatch } from './matchStorage';

function fakeStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(MATCH_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('match storage', () => {
  it('round-trips score, F and breaker', () => {
    const storage = fakeStorage();
    let match = createMatch({ lagAtStart: false });
    match = updateScore(match, 1, 1);
    match = updateFerme(match, 2, 1);
    saveMatch(match, storage);
    const loaded = loadMatch({ lagAtStart: false }, storage);
    expect(loaded.scores).toEqual({ 1: 1, 2: 0 });
    expect(loaded.fermes).toEqual({ 1: 0, 2: 1 });
    expect(loaded.breaker).toBe(2);
  });

  it('survives corrupted JSON', () => {
    expect(loadMatch({ lagAtStart: true }, fakeStorage('{nope')).lagPending).toBe(true);
  });
});
