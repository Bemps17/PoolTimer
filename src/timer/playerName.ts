/** Upper bound so a prénom + nom fits settings and the scoreboard without unbounded strings. */
export const PLAYER_NAME_MAX_LENGTH = 32;

/** Smallest readable size on a phone chip; short names stay at the CSS default (~1.2rem). */
export const PLAYER_NAME_MIN_FONT_PX = 11;

export function clampPlayerNameInput(value: string): string {
  return value.slice(0, PLAYER_NAME_MAX_LENGTH);
}

/** Trim / collapse spaces and cap length. Empty is kept empty (never injects P1 / P). */
export function storedPlayerName(value: string): string {
  return clampPlayerNameInput(value.replace(/\s+/g, ' ').trim());
}

/**
 * Persist names exactly as stored.
 * - missing / non-string → fallback (first launch / corrupt storage)
 * - "" or whitespace → empty string (user cleared the field)
 */
export function readStoredPlayerName(value: unknown, fallbackWhenMissing: string): string {
  if (typeof value !== 'string') return fallbackWhenMissing;
  return storedPlayerName(value);
}

/** @deprecated Prefer storedPlayerName / readStoredPlayerName. Empty no longer falls back. */
export function sanitizePlayerName(value: unknown, fallback: string): string {
  return readStoredPlayerName(value, fallback);
}

/** UI-only label when the stored name is empty — never written back to config. */
export function displayPlayerName(stored: string, seat: 1 | 2): string {
  const trimmed = stored.trim();
  if (trimmed) return trimmed;
  return `Joueur ${seat}`;
}

/**
 * One-shot scale from measured overflow at `maxFontSize`.
 * Wrapping text is not perfectly linear; the React helper binary-searches after this hint.
 */
export function computeFitFontSize(options: {
  availableWidth: number;
  availableHeight: number;
  contentWidth: number;
  contentHeight: number;
  maxFontSize: number;
  minFontSize: number;
}): number {
  const { availableWidth, availableHeight, contentWidth, contentHeight, maxFontSize, minFontSize } = options;
  if (!(maxFontSize > 0)) return minFontSize;
  if (minFontSize >= maxFontSize) return minFontSize;
  if (availableWidth <= 0 || availableHeight <= 0) return maxFontSize;
  if (contentWidth <= 0 || contentHeight <= 0) return maxFontSize;

  const widthScale = contentWidth > availableWidth ? availableWidth / contentWidth : 1;
  const heightScale = contentHeight > availableHeight ? availableHeight / contentHeight : 1;
  return Math.max(minFontSize, Math.min(maxFontSize, maxFontSize * Math.min(widthScale, heightScale)));
}
