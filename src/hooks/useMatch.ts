import { useCallback, useEffect, useState } from 'react';
import {
  resetMatch,
  setFirstBreaker,
  skipLag,
  toggleBreaker,
  undo,
  updateFerme,
  updateScore,
  type MatchOptions,
  type MatchState,
} from '../timer/match';
import { loadMatch, saveMatch } from '../timer/matchStorage';
import type { PlayerId } from '../timer/types';

export function useMatch(options: MatchOptions) {
  const [match, setMatch] = useState<MatchState>(() => loadMatch(options));

  useEffect(() => {
    saveMatch(match);
  }, [match]);

  // Activer l'option tirage sur un match vierge arme le tirage ; la désactiver le désarme.
  useEffect(() => {
    setMatch((current) => {
      const untouched =
        current.history.length === 0 &&
        current.scores[1] === 0 &&
        current.scores[2] === 0 &&
        current.fermes[1] === 0 &&
        current.fermes[2] === 0;
      if (options.lagAtStart && untouched && !current.lagPending) return { ...current, lagPending: true };
      if (!options.lagAtStart && current.lagPending) return { ...current, lagPending: false };
      return current;
    });
  }, [options.lagAtStart]);

  const addScore = useCallback((player: PlayerId, delta: number) => setMatch((m) => updateScore(m, player, delta)), []);
  const addFerme = useCallback((player: PlayerId, delta: number) => setMatch((m) => updateFerme(m, player, delta)), []);
  const swapBreaker = useCallback(() => setMatch((m) => toggleBreaker(m)), []);
  const chooseFirstBreaker = useCallback((winner: PlayerId) => setMatch((m) => setFirstBreaker(m, winner)), []);
  const dismissLag = useCallback(() => setMatch((m) => skipLag(m)), []);
  const undoLast = useCallback(() => setMatch((m) => undo(m)), []);
  const newMatch = useCallback(() => setMatch(resetMatch(options)), [options]);

  return {
    match,
    canUndo: match.history.length > 0,
    addScore,
    addFerme,
    swapBreaker,
    chooseFirstBreaker,
    dismissLag,
    undoLast,
    newMatch,
  };
}

export type MatchController = ReturnType<typeof useMatch>;
