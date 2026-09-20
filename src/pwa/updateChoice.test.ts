import { describe, expect, it } from 'vitest';
import { rollbackCopy, shouldShowUpdateBanner, snoozeToken } from './updateChoice';

describe('update choice', () => {
  it('hides the banner after snoozing the same incoming version', () => {
    expect(
      shouldShowUpdateBanner({
        updateAvailable: true,
        incomingVersion: '2.6.0',
        snoozedVersion: '2.6.0',
      }),
    ).toBe(false);
    expect(
      shouldShowUpdateBanner({
        updateAvailable: true,
        incomingVersion: '2.6.1',
        snoozedVersion: '2.6.0',
      }),
    ).toBe(true);
    expect(
      shouldShowUpdateBanner({
        updateAvailable: true,
        incomingVersion: '2.6.0',
        snoozedVersion: '2.6.0',
        forceShow: true,
      }),
    ).toBe(true);
  });

  it('does not claim a true rollback after the update is already installed', () => {
    expect(rollbackCopy({ updateAvailable: false, snoozed: false }).canRollbackInstalled).toBe(false);
    expect(rollbackCopy({ updateAvailable: true, snoozed: true }).canStayOnCurrent).toBe(true);
    expect(snoozeToken()).toBe('pending');
    expect(snoozeToken(' 2.6.0 ')).toBe('2.6.0');
  });
});
