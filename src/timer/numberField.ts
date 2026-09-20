/** Commit a typed integer: empty / invalid keeps the previous value, then clamp to [min, max]. */
export function commitIntegerField(raw: string, previous: number, min: number, max: number): number {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return previous;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) return previous;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function stepperDisplay(value: number, suffix?: string): string {
  return suffix ? `${value} ${suffix}` : String(value);
}
