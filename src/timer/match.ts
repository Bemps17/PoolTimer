import type { PlayerId } from './types';

/**
 * Scoreur 1 contre 1. Un « côté » est un joueur OU une équipe : la logique est identique.
 * Le score (manches) et les casses fermes (F) sont deux compteurs strictement indépendants.
 * Logique alignée sur Scoreurv3 : le casseur alterne à chaque point marqué (+1), un −1 ne le change pas.
 */

export const MATCH_LIMITS = {
  score: { min: 0, max: 99 },
  ferme: { min: 0, max: 99 },
  targetScore: { min: 0, max: 500 },
} as const;

export const MATCH_UNDO_LIMIT = 50;

export interface MatchOptions {
  /** Affiche le scoreur (télécommande et écran Visuel). */
  enabled: boolean;
  /** Tirage à la bande au début du match pour désigner le premier casseur. */
  lagAtStart: boolean;
  /** Course à N (0 = pas de victoire automatique). */
  targetScore: number;
  showFerme: boolean;
  showBreaker: boolean;
}

export interface MatchCounters {
  scores: Record<PlayerId, number>;
  fermes: Record<PlayerId, number>;
  breaker: PlayerId;
  /** Vrai tant que le tirage à la bande n'a pas désigné le premier casseur. */
  lagPending: boolean;
}

export interface MatchState extends MatchCounters {
  history: MatchCounters[];
}

export function getDefaultMatchOptions(): MatchOptions {
  return { enabled: true, lagAtStart: false, targetScore: 0, showFerme: true, showBreaker: true };
}

export function createMatch(options: Pick<MatchOptions, 'lagAtStart'>): MatchState {
  return {
    scores: { 1: 0, 2: 0 },
    fermes: { 1: 0, 2: 0 },
    breaker: 1,
    lagPending: options.lagAtStart,
    history: [],
  };
}

function other(player: PlayerId): PlayerId {
  return player === 1 ? 2 : 1;
}

function counters(state: MatchState): MatchCounters {
  return {
    scores: { ...state.scores },
    fermes: { ...state.fermes },
    breaker: state.breaker,
    lagPending: state.lagPending,
  };
}

function withHistory(state: MatchState, next: Partial<MatchCounters>): MatchState {
  const history = [...state.history, counters(state)].slice(-MATCH_UNDO_LIMIT);
  return { ...state, ...next, history };
}

/** Casseur après un point marqué (alternance). */
export function breakerAfterScoreDelta(breaker: PlayerId, delta: number): PlayerId {
  return delta > 0 ? other(breaker) : breaker;
}

export function updateScore(state: MatchState, player: PlayerId, delta: number): MatchState {
  const next = state.scores[player] + delta;
  if (delta === 0 || next < MATCH_LIMITS.score.min || next > MATCH_LIMITS.score.max) return state;
  return withHistory(state, {
    scores: { ...state.scores, [player]: next },
    breaker: breakerAfterScoreDelta(state.breaker, delta),
    // Un point marqué clôt de fait le tirage : l'alternance prend le relais.
    lagPending: false,
  });
}

/** Casse ferme : compteur séparé, n'affecte ni le score ni le casseur. */
export function updateFerme(state: MatchState, player: PlayerId, delta: number): MatchState {
  const next = state.fermes[player] + delta;
  if (delta === 0 || next < MATCH_LIMITS.ferme.min || next > MATCH_LIMITS.ferme.max) return state;
  return withHistory(state, { fermes: { ...state.fermes, [player]: next } });
}

/** Correction manuelle (appui sur la blanche). */
export function toggleBreaker(state: MatchState): MatchState {
  return withHistory(state, { breaker: other(state.breaker) });
}

/** Résultat du tirage à la bande : le gagnant casse en premier. */
export function setFirstBreaker(state: MatchState, winner: PlayerId): MatchState {
  return withHistory(state, { breaker: winner, lagPending: false });
}

/** Ignorer le tirage (garde le casseur courant). */
export function skipLag(state: MatchState): MatchState {
  if (!state.lagPending) return state;
  return withHistory(state, { lagPending: false });
}

export function undo(state: MatchState): MatchState {
  const previous = state.history[state.history.length - 1];
  if (!previous) return state;
  return { ...previous, scores: { ...previous.scores }, fermes: { ...previous.fermes }, history: state.history.slice(0, -1) };
}

/** Nouveau match : remet tout à zéro (et réarme le tirage si l'option est active). */
export function resetMatch(options: Pick<MatchOptions, 'lagAtStart'>): MatchState {
  return createMatch(options);
}

export function isVictory(score: number, targetScore: number): boolean {
  return targetScore > 0 && score >= targetScore;
}

export function matchWinner(state: Pick<MatchCounters, 'scores'>, targetScore: number): PlayerId | null {
  const w1 = isVictory(state.scores[1], targetScore);
  const w2 = isVictory(state.scores[2], targetScore);
  if (w1 && !w2) return 1;
  if (w2 && !w1) return 2;
  if (w1 && w2) return state.scores[1] >= state.scores[2] ? 1 : 2;
  return null;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asPlayer(value: unknown, fallback: PlayerId): PlayerId {
  return value === 1 || value === 2 ? value : fallback;
}

function mergeCounters(raw: unknown, fallback: MatchCounters): MatchCounters {
  if (!raw || typeof raw !== 'object') return fallback;
  const value = raw as Partial<Record<keyof MatchCounters, unknown>>;
  const scores = (value.scores ?? {}) as Partial<Record<PlayerId, unknown>>;
  const fermes = (value.fermes ?? {}) as Partial<Record<PlayerId, unknown>>;
  const { score, ferme } = MATCH_LIMITS;
  return {
    scores: {
      1: clampInt(scores[1], fallback.scores[1], score.min, score.max),
      2: clampInt(scores[2], fallback.scores[2], score.min, score.max),
    },
    fermes: {
      1: clampInt(fermes[1], fallback.fermes[1], ferme.min, ferme.max),
      2: clampInt(fermes[2], fallback.fermes[2], ferme.min, ferme.max),
    },
    breaker: asPlayer(value.breaker, fallback.breaker),
    lagPending: asBool(value.lagPending, fallback.lagPending),
  };
}

export function mergeMatchOptions(raw: unknown): MatchOptions {
  const defaults = getDefaultMatchOptions();
  if (!raw || typeof raw !== 'object') return defaults;
  const value = raw as Partial<Record<keyof MatchOptions, unknown>>;
  return {
    enabled: asBool(value.enabled, defaults.enabled),
    lagAtStart: asBool(value.lagAtStart, defaults.lagAtStart),
    targetScore: clampInt(
      value.targetScore,
      defaults.targetScore,
      MATCH_LIMITS.targetScore.min,
      MATCH_LIMITS.targetScore.max,
    ),
    showFerme: asBool(value.showFerme, defaults.showFerme),
    showBreaker: asBool(value.showBreaker, defaults.showBreaker),
  };
}

/** Valide un état de match venant du stockage local. Jamais de confiance au JSON entrant. */
export function mergeMatch(raw: unknown, options: Pick<MatchOptions, 'lagAtStart'>): MatchState {
  const fallback = createMatch(options);
  if (!raw || typeof raw !== 'object') return fallback;
  const base = mergeCounters(raw, fallback);
  const rawHistory = (raw as { history?: unknown }).history;
  const history = Array.isArray(rawHistory)
    ? rawHistory.slice(-MATCH_UNDO_LIMIT).map((entry) => mergeCounters(entry, fallback))
    : [];
  return { ...base, history };
}
