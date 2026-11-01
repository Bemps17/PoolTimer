import { describe, expect, it } from 'vitest';
import { contrastRatio, themeContrastIssues, MIN_CONTRAST } from './contrast';
import { colorsForTheme } from './theme';
import type { Theme } from './types';

describe('contraste des thèmes (WCAG)', () => {
  it('computes the WCAG contrast ratio', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 1); // forme courte
    expect(contrastRatio('#abc', 'rouge')).toBe(1); // illisible : ne plante pas
  });

  it('flags a timer that is unreadable on its background', () => {
    const colors = { ...colorsForTheme('sombre'), screen: '#222222', digitDefault: '#2a2a2a' };
    const issues = themeContrastIssues(colors);
    expect(issues.map((i) => i.key)).toContain('digitDefault');
    expect(issues.find((i) => i.key === 'digitDefault')!.ratio).toBeLessThan(MIN_CONTRAST.digits);
  });

  it('flags unreadable menu text and stays quiet on a good palette', () => {
    const bad = { ...colorsForTheme('sombre'), panelTextPrimary: '#222222', panelBg: '#222222' };
    expect(themeContrastIssues(bad).map((i) => i.key)).toContain('panelTextPrimary');
    const good = { ...colorsForTheme('sombre'), digitDefault: '#ffffff', digitWarning: '#ffcc00', digitCritical: '#ff5555', screen: '#000000' };
    expect(themeContrastIssues(good).filter((i) => i.key.startsWith('digit'))).toEqual([]);
  });

  it('every built-in theme keeps its timer digits readable (regression guard)', () => {
    for (const theme of ['sombre', 'light', 'cyberpunk', 'ffb', 'fbep'] as Theme[]) {
      const issues = themeContrastIssues(colorsForTheme(theme)).filter((i) => i.key.startsWith('digit'));
      expect(issues, theme).toEqual([]);
    }
  });
});
