import { describe, expect, it } from 'vitest';
import { getDefaultViewOptions, isRemoteViewActive, mergeViewOptions } from './viewOptions';

describe('options d’affichage', () => {
  it('defaults put the timer first and the score second', () => {
    const d = getDefaultViewOptions();
    expect(d.displayLayout).toBe('timer');
    expect(d.remoteScore).toBe('compact');
    expect(d.remoteLayout).toBe('remote');
  });

  it('sanitizes stored values', () => {
    expect(mergeViewOptions(null)).toEqual(getDefaultViewOptions());
    expect(
      mergeViewOptions({ displayLayout: 'nope', remoteLayout: 'classic', remoteScore: 'hidden', remoteWakeLock: 'x' }),
    ).toEqual({ displayLayout: 'timer', remoteLayout: 'classic', remoteScore: 'hidden', remoteWakeLock: true });
  });

  it('activates the remote view only with an open room', () => {
    expect(isRemoteViewActive(true, { remoteLayout: 'remote' })).toBe(true);
    expect(isRemoteViewActive(false, { remoteLayout: 'remote' })).toBe(false);
    expect(isRemoteViewActive(true, { remoteLayout: 'classic' })).toBe(false);
  });
});
