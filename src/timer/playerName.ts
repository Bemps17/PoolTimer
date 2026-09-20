/** Upper bound so a prénom + nom fits settings and the scoreboard without unbounded strings. */
export const PLAYER_NAME_MAX_LENGTH = 32;

/** Smallest readable size on a phone chip; short names stay at the CSS default (~1.2rem). */
export const PLAYER_NAME_MIN_FONT_PX = 11;

export function sanitizePlayerName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const collapsed = value.replace(/\s+/g, ' ').trim();
  if (!collapsed) return fallback;
  return collapsed.slice(0, PLAYER_NAME_MAX_LENGTH);
}

export function clampPlayerNameInput(value: string): string {
  return value.slice(0, PLAYER_NAME_MAX_LENGTH);
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
