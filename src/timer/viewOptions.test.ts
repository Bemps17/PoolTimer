import { describe, expect, it } from 'vitest';
import { boardLayout, getDefaultViewOptions, isRemoteViewActive, mergeViewOptions } from './viewOptions';

describe('options d’affichage', () => {
  it('defaults put the timer first, portrait only', () => {
    const d = getDefaultViewOptions();
    expect(d.displayLayout).toBe('timer');
    expect(d.remoteLayout).toBe('remote');
    expect(d.landscape).toBe(false);
  });

  it('sanitizes stored values (and drops the old remoteScore option)', () => {
    expect(mergeViewOptions(null)).toEqual(getDefaultViewOptions());
    expect(
      mergeViewOptions({
        displayLayout: 'nope',
        remoteLayout: 'classic',
        remoteScore: 'hidden',
        remoteWakeLock: 'x',
        landscape: 'yes',
      }),
    ).toEqual({ displayLayout: 'timer', remoteLayout: 'classic', remoteWakeLock: true, landscape: false });
    expect(mergeViewOptions({ landscape: true }).landscape).toBe(true);
  });

  it('activates the remote view only with an open room', () => {
    expect(isRemoteViewActive(true, { remoteLayout: 'remote' })).toBe(true);
    expect(isRemoteViewActive(false, { remoteLayout: 'remote' })).toBe(false);
    expect(isRemoteViewActive(true, { remoteLayout: 'classic' })).toBe(false);
  });
});

describe('disposition de l’écran de jeu', () => {
  it('portrait by default: classic without room, remote with room', () => {
    expect(boardLayout({ remoteActive: false, landscapeOption: false, isLandscape: false })).toBe('classic');
    expect(boardLayout({ remoteActive: true, landscapeOption: false, isLandscape: false })).toBe('remote');
  });

  it('turning the phone does nothing while the landscape option is off', () => {
    expect(boardLayout({ remoteActive: true, landscapeOption: false, isLandscape: true })).toBe('remote');
    expect(boardLayout({ remoteActive: false, landscapeOption: false, isLandscape: true })).toBe('classic');
  });

  it('landscape option on: side-by-side layout as soon as the phone is turned, with or without room', () => {
    expect(boardLayout({ remoteActive: true, landscapeOption: true, isLandscape: true })).toBe('landscape');
    expect(boardLayout({ remoteActive: false, landscapeOption: true, isLandscape: true })).toBe('landscape');
    expect(boardLayout({ remoteActive: true, landscapeOption: true, isLandscape: false })).toBe('remote');
  });
});
