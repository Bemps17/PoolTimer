import { describe, expect, it } from 'vitest';
import {
  PLAYER_NAME_MAX_LENGTH,
  clampPlayerNameInput,
  computeFitFontSize,
  displayPlayerName,
  readStoredPlayerName,
  storedPlayerName,
} from './playerName';

describe('storedPlayerName', () => {
  it('keeps a full first and last name', () => {
    expect(storedPlayerName('Jean-Baptiste Moreau')).toBe('Jean-Baptiste Moreau');
  });

  it('trims and collapses spaces', () => {
    expect(storedPlayerName('  Anne   Dupont  ')).toBe('Anne Dupont');
  });

  it('allows an empty name instead of injecting P1 or P', () => {
    expect(storedPlayerName('   ')).toBe('');
    expect(storedPlayerName('')).toBe('');
    expect(storedPlayerName('P')).toBe('P');
  });

  it(`caps names at ${PLAYER_NAME_MAX_LENGTH} characters`, () => {
    const long = 'Jean-Baptiste Alexandre Moreau-Dupont';
    expect(long.length).toBeGreaterThan(PLAYER_NAME_MAX_LENGTH);
    expect(storedPlayerName(long)).toHaveLength(PLAYER_NAME_MAX_LENGTH);
  });
});

describe('readStoredPlayerName', () => {
  it('uses the fallback only when the value is missing, not when it is empty', () => {
    expect(readStoredPlayerName(undefined, 'P1')).toBe('P1');
    expect(readStoredPlayerName(null, 'P2')).toBe('P2');
    expect(readStoredPlayerName('', 'P1')).toBe('');
    expect(readStoredPlayerName('   ', 'P1')).toBe('');
  });
});

describe('displayPlayerName', () => {
  it('shows a UI placeholder without implying it should be stored', () => {
    expect(displayPlayerName('', 1)).toBe('Joueur 1');
    expect(displayPlayerName('   ', 2)).toBe('Joueur 2');
    expect(displayPlayerName('Alex', 1)).toBe('Alex');
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
