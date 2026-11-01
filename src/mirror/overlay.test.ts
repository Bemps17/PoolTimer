import { describe, expect, it } from 'vitest';
import {
  getDefaultOverlayOptions,
  loadOverlayOptions,
  overlayUrl,
  parseOverlayOptions,
  parseOverlayRoom,
  sanitizeOverlayOptions,
} from './overlay';

describe('overlay de streaming (OBS / Streamlabs)', () => {
  it('parses /o/CODE and rejects invalid codes', () => {
    expect(parseOverlayRoom('/o/ab3k7q')).toBe('AB3K7Q');
    expect(parseOverlayRoom('/o/AB3K7Q/')).toBe('AB3K7Q');
    expect(parseOverlayRoom('/o/OOOOOO')).toBeNull();
    expect(parseOverlayRoom('/d/AB3K7Q')).toBeNull();
    expect(parseOverlayRoom('/')).toBeNull();
  });

  it('uses defaults and a minimal URL when nothing is customised', () => {
    expect(overlayUrl('https://pooltimer.vercel.app/', 'ab3k7q', getDefaultOverlayOptions())).toBe(
      'https://pooltimer.vercel.app/o/AB3K7Q',
    );
    expect(parseOverlayOptions('')).toEqual(getDefaultOverlayOptions());
  });

  it('round-trips every option through the URL', () => {
    const options = {
      parts: 'timer' as const,
      layout: 'column' as const,
      showNames: false,
      showFerme: false,
      showBreaker: false,
      scale: 70,
      background: 'chroma' as const,
    };
    const url = new URL(overlayUrl('https://x.test', 'AB3K7Q', options));
    expect(url.pathname).toBe('/o/AB3K7Q');
    expect(parseOverlayOptions(url.search)).toEqual(options);
  });

  it('sanitizes hostile or garbage parameters', () => {
    const parsed = parseOverlayOptions('?p=<script>&l=zzz&s=99999&bg=red&n=maybe');
    expect(parsed).toEqual({ ...getDefaultOverlayOptions(), scale: 100 });
    expect(sanitizeOverlayOptions({ scale: -5 }).scale).toBe(40);
    expect(sanitizeOverlayOptions({ scale: 'abc' }).scale).toBe(100);
  });

  it('loads stored options defensively', () => {
    const storage = { getItem: () => '{broken' };
    expect(loadOverlayOptions(storage)).toEqual(getDefaultOverlayOptions());
    expect(loadOverlayOptions({ getItem: () => JSON.stringify({ parts: 'score', scale: 50 }) })).toMatchObject({
      parts: 'score',
      scale: 50,
    });
  });
});
