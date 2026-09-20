import { describe, expect, it } from 'vitest';
import { applyCompetitionPreset, applyNamedTheme, getDefaultConfig, matchesCompetitionPreset } from './config';
import {
  FBEP_AMBIANCE,
  FFB_AMBIANCE,
  NAMED_THEME_PALETTES,
  THEME_COLOR_KEYS,
  THEME_COLOR_ZONES,
  applyThemeToDocument,
  colorsForTheme,
  mixHex,
  normalizeHexColor,
  parseThemeColors,
  suggestedThemeForCompetition,
  themeBodyClass,
} from './theme';

describe('theme tokens', () => {
  it('exposes a picker for every documented UI zone', () => {
    const keys = THEME_COLOR_ZONES.map((zone) => zone.key);
    expect(new Set(keys)).toEqual(new Set(THEME_COLOR_KEYS));
    expect(keys).toHaveLength(THEME_COLOR_KEYS.length);
    expect(keys).toEqual(
      expect.arrayContaining([
        'background',
        'bezel',
        'screen',
        'buttonBg',
        'digitDefault',
        'digitWarning',
        'digitCritical',
        'ambiance',
        'primary',
        'play',
        'controlFooter',
        'playerChipBg',
        'panelBg',
        'border',
      ]),
    );
  });

  it('fills named themes including FFB blue and Ultimate vert canard', () => {
    expect(colorsForTheme('ffb').ambiance).toBe(FFB_AMBIANCE);
    expect(colorsForTheme('ffb').primary).toBe(FFB_AMBIANCE);
    expect(colorsForTheme('fbep').ambiance).toBe(FBEP_AMBIANCE);
    expect(colorsForTheme('fbep').primary).toBe(FBEP_AMBIANCE);
    expect(colorsForTheme('fbep').background).toBe(mixHex(FBEP_AMBIANCE, 16, '#000000'));
    expect(NAMED_THEME_PALETTES.sombre.background).toBe('#0a0a0a');
  });

  it('normalizes hex and fills missing tokens from the fallback palette', () => {
    expect(normalizeHexColor('#abc', '#000000')).toBe('#aabbcc');
    expect(normalizeHexColor('nope', '#112233')).toBe('#112233');
    const parsed = parseThemeColors({ ambiance: '#abc', unknown: '#fff' }, colorsForTheme('sombre'));
    expect(parsed.ambiance).toBe('#aabbcc');
    expect(parsed.bezel).toBe(colorsForTheme('sombre').bezel);
  });

  it('suggests FFB / FBEP ambiance when applying a competition preset, then lets theme change freely', () => {
    expect(suggestedThemeForCompetition('fbep')).toBe('fbep');
    expect(suggestedThemeForCompetition('ffbMaster')).toBe('ffb');
    const ultimate = applyCompetitionPreset(getDefaultConfig(), 'fbep');
    expect(ultimate.theme).toBe('fbep');
    expect(ultimate.colors.ambiance).toBe(FBEP_AMBIANCE);
    const cyber = applyNamedTheme(ultimate, 'cyberpunk');
    expect(cyber.theme).toBe('cyberpunk');
    expect(matchesCompetitionPreset(cyber, 'fbep')).toBe(true);
    expect(cyber.tempsExtension).toBe(15);
  });

  it('applies CSS variables and the named theme class on the document', () => {
    const classes = new Set<string>();
    const props = new Map<string, string>();
    const root = {
      classList: {
        add: (name: string) => {
          classes.add(name);
        },
        remove: (name: string) => {
          classes.delete(name);
        },
      },
      style: {
        setProperty: (name: string, value: string) => {
          props.set(name, value);
        },
      },
    };
    applyThemeToDocument('fbep', { ...colorsForTheme('fbep'), ambiance: '#112233' }, root);
    expect(classes.has('theme-fbep')).toBe(true);
    expect(props.get('--c-ambiance')).toBe('#112233');
    expect(props.get('--c-primary')).toBe(FBEP_AMBIANCE);
    expect(themeBodyClass('sombre')).toBe('');
    applyThemeToDocument('sombre', colorsForTheme('sombre'), root);
    expect(classes.has('theme-fbep')).toBe(false);
  });
});
