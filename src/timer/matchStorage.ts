import { mergeMatch, type MatchOptions, type MatchState } from './match';

export const MATCH_STORAGE_KEY = 'h8timer.match';

export function loadMatch(
  options: Pick<MatchOptions, 'lagAtStart'>,
  storage: Pick<Storage, 'getItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): MatchState {
  try {
    const raw = storage?.getItem(MATCH_STORAGE_KEY);
    return mergeMatch(raw ? JSON.parse(raw) : null, options);
  } catch {
    return mergeMatch(null, options);
  }
}

export function saveMatch(
  match: MatchState,
  storage: Pick<Storage, 'setItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): void {
  try {
    storage?.setItem(MATCH_STORAGE_KEY, JSON.stringify(match));
  } catch {
    // quota / mode privé : le score reste en mémoire
  }
}
