/**
 * Prochain réveil utile du chrono : juste après le prochain changement du chiffre affiché.
 * Au-dessus de 10 s (ou sans dixièmes) l'affichage change chaque seconde ; en dessous, chaque dixième.
 * Remplace un setInterval de 50 ms (20 réveils/s, même quand rien ne change) : moins de CPU, moins de batterie.
 */
export const TICK_MARGIN_MS = 5;

export function nextTickDelay(remainingMs: number, affichageMs: boolean): number {
  const remaining = Math.max(0, remainingMs);
  if (remaining <= 0) return 100;
  const step = affichageMs && remaining <= 10_000 ? 100 : 1_000;
  const untilChange = remaining % step || step;
  return untilChange + TICK_MARGIN_MS;
}
