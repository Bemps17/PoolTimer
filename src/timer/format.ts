export function formatTime(timeMs: number, affichageMs: boolean): string {
  if (affichageMs && timeMs < 10000 && timeMs > 0) {
    return (timeMs / 1000).toFixed(1);
  }
  return Math.ceil(Math.max(0, timeMs) / 1000)
    .toString()
    .padStart(2, '0');
}

export function formatSecondsClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
