import { describe, expect, it } from 'vitest';
import {
  PLAYER_NAME_MAX_LENGTH,
  clampPlayerNameInput,
  computeFitFontSize,
  sanitizePlayerName,
} from './playerName';

describe('sanitizePlayerName', () => {
  it('keeps a full first and last name', () => {
    expect(sanitizePlayerName('Jean-Baptiste Moreau', 'P1')).toBe('Jean-Baptiste Moreau');
  });

  it('trims and collapses spaces', () => {
    expect(sanitizePlayerName('  Anne   Dupont  ', 'P1')).toBe('Anne Dupont');
  });

  it('falls back when empty or not a string', () => {
    expect(sanitizePlayerName('   ', 'P1')).toBe('P1');
    expect(sanitizePlayerName(null, 'P2')).toBe('P2');
  });

  it(`caps names at ${PLAYER_NAME_MAX_LENGTH} characters`, () => {
    const long = 'Jean-Baptiste Alexandre Moreau-Dupont';
    expect(long.length).toBeGreaterThan(PLAYER_NAME_MAX_LENGTH);
    expect(sanitizePlayerName(long, 'P1')).toHaveLength(PLAYER_NAME_MAX_LENGTH);
  });
});

describe('clampPlayerNameInput', () => {
  it('does not trim while typing, only caps length', () => {
    expect(clampPlayerNameInput('Jean-Baptiste ')).toBe('Jean-Baptiste ');
    const overflow = `${'A'.repeat(PLAYER_NAME_MAX_LENGTH)}XYZ`;
    expect(clampPlayerNameInput(overflow)).toHaveLength(PLAYER_NAME_MAX_LENGTH);
  });
});

describe('computeFitFontSize', () => {
  it('keeps the default size when the text already fits', () => {
    expect(
      computeFitFontSize({
        availableWidth: 160,
        availableHeight: 40,
        contentWidth: 48,
        contentHeight: 22,
        maxFontSize: 19.2,
        minFontSize: 11,
      }),
    ).toBe(19.2);
  });

  it('shrinks proportionally when the name overflows the chip width', () => {
    const size = computeFitFontSize({
      availableWidth: 80,
      availableHeight: 40,
      contentWidth: 160,
      contentHeight: 22,
      maxFontSize: 20,
      minFontSize: 8,
    });
    expect(size).toBe(10);
  });

  it('does not go below the readable minimum', () => {
    expect(
      computeFitFontSize({
        availableWidth: 20,
        availableHeight: 20,
        contentWidth: 400,
        contentHeight: 40,
        maxFontSize: 20,
        minFontSize: 11,
      }),
    ).toBe(11);
  });
});
