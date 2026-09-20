import { describe, expect, it } from 'vitest';
import {
  CONTROLLER_SYNC_WAIT_MS,
  DISPLAY_SNAPSHOT_WAIT_MS,
  controllerSyncStatus,
  displaySyncStatus,
} from './syncStatus';

describe('controller sync status', () => {
  it('shows display count wait, then pas de sync, then sync OK after push_ok', () => {
    const base = {
      status: 'live' as const,
      error: null,
      liveSince: 1_000,
      now: 1_000,
      room: 'AB3K7Q',
    };
    expect(controllerSyncStatus({ ...base, displayCount: 0, lastPushOkAt: null }).chip).toContain(
      'en attente d’un écran',
    );
    expect(
      controllerSyncStatus({
        ...base,
        displayCount: 1,
        lastPushOkAt: null,
        now: 1_000 + CONTROLLER_SYNC_WAIT_MS,
      }).chip,
    ).toBe('Écran lié · pas de sync');
    expect(
      controllerSyncStatus({
        ...base,
        displayCount: 1,
        lastPushOkAt: 2_000,
        now: 4_000,
      }).chip,
    ).toBe('Écran lié · sync OK');
    expect(
      controllerSyncStatus({
        ...base,
        displayCount: 1,
        lastPushOkAt: null,
        lastErrorCode: 'bad_push',
        error: 'Snapshot invalide.',
        now: 1_000 + CONTROLLER_SYNC_WAIT_MS,
      }).chip,
    ).toBe('Écran lié · pas de sync · bad_push');
  });
});

describe('display sync status', () => {
  it('hides the frozen 00 clock until a snapshot arrives', () => {
    expect(
      displaySyncStatus({
        status: 'live',
        error: null,
        hasSnapshot: false,
        lastSnapshotAt: null,
        liveSince: 10,
        now: 10 + DISPLAY_SNAPSHOT_WAIT_MS,
      }),
    ).toEqual({
      label: 'En attente de la télécommande…',
      waitingForSnapshot: true,
    });
    expect(
      displaySyncStatus({
        status: 'live',
        error: 'Snapshot invalide.',
        lastErrorCode: 'unparsed',
        hasSnapshot: false,
        lastSnapshotAt: null,
        liveSince: 10,
        now: 10 + DISPLAY_SNAPSHOT_WAIT_MS,
      }).label,
    ).toBe('En attente de la télécommande… · unparsed');
    expect(
      displaySyncStatus({
        status: 'live',
        error: null,
        hasSnapshot: true,
        lastSnapshotAt: 50_000,
        liveSince: 40_000,
        now: 51_500,
      }),
    ).toEqual({
      label: 'Sync OK',
      waitingForSnapshot: false,
    });
    expect(
      displaySyncStatus({
        status: 'live',
        error: null,
        hasSnapshot: true,
        lastSnapshotAt: 50_000,
        liveSince: 40_000,
        now: 53_000,
      }).label,
    ).toBe('Sync OK · 3s');
  });
});
