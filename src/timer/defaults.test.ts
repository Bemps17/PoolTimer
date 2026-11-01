import { describe, expect, it } from 'vitest';
import { CURRENT_DEFAULTS_VERSION, getDefaultConfig, mergeConfig } from './config';
import { getDefaultMatchOptions } from './match';

describe('affichage minimal par défaut : le chrono seul', () => {
  it('a fresh install shows the timer only; enabling the score does not show F', () => {
    const options = getDefaultMatchOptions();
    expect(options.enabled).toBe(false);
    expect(options.showFerme).toBe(false);
    expect(getDefaultConfig().matchOptions.enabled).toBe(false);
    expect(getDefaultConfig().defaultsVersion).toBe(CURRENT_DEFAULTS_VERSION);
  });

  it('applies the new defaults once to configs saved before (3.1 and older)', () => {
    const legacy = mergeConfig({ tempsBase: 30, matchOptions: { enabled: true, showFerme: true, targetScore: 7 } });
    expect(legacy.matchOptions.enabled).toBe(false);
    expect(legacy.matchOptions.showFerme).toBe(false);
    expect(legacy.matchOptions.targetScore).toBe(7); // le reste des réglages est conservé
    expect(legacy.tempsBase).toBe(30);
    expect(legacy.defaultsVersion).toBe(CURRENT_DEFAULTS_VERSION);
  });

  it('then respects the user’s explicit choice', () => {
    const chosen = mergeConfig({
      defaultsVersion: CURRENT_DEFAULTS_VERSION,
      matchOptions: { enabled: true, showFerme: true },
    });
    expect(chosen.matchOptions.enabled).toBe(true);
    expect(chosen.matchOptions.showFerme).toBe(true);
  });
});
