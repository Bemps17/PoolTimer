import { describe, expect, it } from 'vitest';
import { boardLayout, getDefaultViewOptions, isRemoteViewActive, mergeViewOptions, orientationLockTarget } from './viewOptions';

describe('options d’affichage', () => {
  it('defaults put the timer first, portrait only', () => {
    const d = getDefaultViewOptions();
    expect(d.displayLayout).toBe('timer');
    expect(d.remoteLayout).toBe('remote');
    expect(d.landscape).toBe('off');
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
    ).toEqual({ displayLayout: 'timer', remoteLayout: 'classic', remoteWakeLock: true, landscape: 'off' });
    expect(mergeViewOptions({ landscape: 'force' }).landscape).toBe('force');
    expect(mergeViewOptions({ landscape: 'auto' }).landscape).toBe('auto');
  });

  it('migrates the 3.4 switch: on = auto, off = off', () => {
    expect(mergeViewOptions({ landscape: true }).landscape).toBe('auto');
    expect(mergeViewOptions({ landscape: false }).landscape).toBe('off');
  });

  it('activates the remote view only with an open room', () => {
    expect(isRemoteViewActive(true, { remoteLayout: 'remote' })).toBe(true);
    expect(isRemoteViewActive(false, { remoteLayout: 'remote' })).toBe(false);
    expect(isRemoteViewActive(true, { remoteLayout: 'classic' })).toBe(false);
  });
});

describe('disposition de l’écran de jeu', () => {
  it('portrait by default: classic without room, remote with room', () => {
    expect(boardLayout({ remoteActive: false, landscapeOption: 'off', isLandscape: false })).toBe('classic');
    expect(boardLayout({ remoteActive: true, landscapeOption: 'off', isLandscape: false })).toBe('remote');
  });

  it('turning the phone does nothing while the landscape option is off', () => {
    expect(boardLayout({ remoteActive: true, landscapeOption: 'off', isLandscape: true })).toBe('remote');
    expect(boardLayout({ remoteActive: false, landscapeOption: 'off', isLandscape: true })).toBe('classic');
  });

  it('landscape option on: side-by-side layout as soon as the phone is turned, with or without room', () => {
    expect(boardLayout({ remoteActive: true, landscapeOption: 'auto', isLandscape: true })).toBe('landscape');
    expect(boardLayout({ remoteActive: false, landscapeOption: 'auto', isLandscape: true })).toBe('landscape');
    expect(boardLayout({ remoteActive: true, landscapeOption: 'auto', isLandscape: false })).toBe('remote');
  });
});

describe('paysage forcé', () => {
  it('uses the landscape layout once the screen is landscape (locked by the app)', () => {
    expect(boardLayout({ remoteActive: true, landscapeOption: 'force', isLandscape: true })).toBe('landscape');
    // verrou refusé (navigateur) : l'écran reste en portrait, on garde la disposition portrait lisible
    expect(boardLayout({ remoteActive: true, landscapeOption: 'force', isLandscape: false })).toBe('remote');
  });
});

describe('verrouillage d’orientation (app installée)', () => {
  // Chrome Android garde l'ancien manifeste (portrait) de l'app installée : « déverrouiller » y revient.
  // On demande donc explicitement « toutes orientations » en Auto, et le paysage en Forcé.
  it('portrait when off, any orientation in auto, landscape when forced', () => {
    expect(orientationLockTarget('off')).toBe('portrait');
    expect(orientationLockTarget('auto')).toBe('any');
    expect(orientationLockTarget('force')).toBe('landscape');
  });
});
