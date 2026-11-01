import type { ThemeColors } from './types';

/** Seuils WCAG 2.1 : texte normal 4,5 ; grands chiffres (chrono, score) 3. */
export const MIN_CONTRAST = { text: 4.5, digits: 3 } as const;

function parseHex(value: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1]!.length === 3 ? match[1]!.replace(/./g, (c) => c + c) : match[1]!;
  return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** Rapport de contraste WCAG entre deux couleurs hex (1 si une couleur est illisible : jamais d'exception). */
export function contrastRatio(foreground: string, background: string): number {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (!fg || !bg) return 1;
  const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

export interface ContrastIssue {
  key: keyof ThemeColors;
  label: string;
  against: keyof ThemeColors;
  ratio: number;
  min: number;
}

const CHECKS: Array<{ key: keyof ThemeColors; against: keyof ThemeColors; label: string; min: number }> = [
  { key: 'digitDefault', against: 'screen', label: 'Chiffres du chrono (normal)', min: MIN_CONTRAST.digits },
  { key: 'digitWarning', against: 'screen', label: 'Chiffres du chrono (alerte)', min: MIN_CONTRAST.digits },
  { key: 'digitCritical', against: 'screen', label: 'Chiffres du chrono (critique)', min: MIN_CONTRAST.digits },
  { key: 'textPrimary', against: 'bezel', label: 'Texte principal', min: MIN_CONTRAST.text },
  { key: 'panelTextPrimary', against: 'panelBg', label: 'Texte du menu réglages', min: MIN_CONTRAST.text },
];

/** Paires illisibles d'une palette (à signaler à l'utilisateur, sans jamais bloquer). */
export function themeContrastIssues(colors: ThemeColors): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  for (const check of CHECKS) {
    const ratio = contrastRatio(colors[check.key], colors[check.against]);
    if (ratio < check.min) issues.push({ ...check, ratio });
  }
  return issues;
}
