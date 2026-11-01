/**
 * Latence réseau télécommande → écran : un snapshot reçu est déjà « vieux » d'un aller simple.
 * Estimation : moitié de la médiane des derniers allers-retours ping/pong (robuste à un ping lent), plafonnée.
 */
export const MAX_ONE_WAY_MS = 500;

export function createLatencyTracker(size = 5) {
  const samples: number[] = [];
  return {
    addRoundTrip(rttMs: number): void {
      if (!Number.isFinite(rttMs) || rttMs < 0) return;
      samples.push(rttMs);
      if (samples.length > size) samples.shift();
    },
    oneWayMs(): number {
      if (samples.length === 0) return 0;
      const sorted = [...samples].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
      return Math.min(MAX_ONE_WAY_MS, Math.round(median / 2));
    },
  };
}
