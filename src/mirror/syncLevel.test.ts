import { describe, expect, it } from 'vitest';
import {
  controllerSyncLevel,
  displaySyncLevel,
  SLOW_RTT_MS,
  STALE_RUNNING_MS,
  syncLevelLabel,
} from './syncLevel';

const now = 100_000;
const okController = { status: 'live' as const, displayCount: 1, rttMs: 40, oldestUnackedAt: null, now };
const okDisplay = {
  status: 'live' as const,
  controllerConnected: true,
  hasSnapshot: true,
  isRunning: true,
  lastSnapshotAt: now - 1_000,
  rttMs: 40,
  now,
};

describe('voyant de synchro — télécommande', () => {
  it('green when linked to a screen with a fast relay', () => {
    expect(controllerSyncLevel(okController)).toBe('ok');
  });
  it('orange when the round trip is slow or acknowledgements lag', () => {
    expect(controllerSyncLevel({ ...okController, rttMs: SLOW_RTT_MS + 1 })).toBe('slow');
    expect(controllerSyncLevel({ ...okController, oldestUnackedAt: now - 4_000 })).toBe('slow');
  });
  it('red when nothing works: relay down, reconnecting, no screen, or no ack for 10 s', () => {
    expect(controllerSyncLevel({ ...okController, status: 'error' })).toBe('down');
    expect(controllerSyncLevel({ ...okController, status: 'connecting' })).toBe('down');
    expect(controllerSyncLevel({ ...okController, displayCount: 0 })).toBe('down');
    expect(controllerSyncLevel({ ...okController, oldestUnackedAt: now - 11_000 })).toBe('down');
  });
  it('unknown round trip is not treated as slow', () => {
    expect(controllerSyncLevel({ ...okController, rttMs: null })).toBe('ok');
  });
});

describe('voyant de synchro — écran Visuel', () => {
  it('green when snapshots arrive from a connected remote', () => {
    expect(displaySyncLevel(okDisplay)).toBe('ok');
  });
  it('orange when the clock runs but updates are late, or the ping is slow', () => {
    expect(displaySyncLevel({ ...okDisplay, lastSnapshotAt: now - STALE_RUNNING_MS - 1 })).toBe('slow');
    expect(displaySyncLevel({ ...okDisplay, rttMs: SLOW_RTT_MS + 50 })).toBe('slow');
  });
  it('a paused clock does not need updates', () => {
    expect(displaySyncLevel({ ...okDisplay, isRunning: false, lastSnapshotAt: now - 600_000 })).toBe('ok');
  });
  it('red when disconnected, without remote or without any state', () => {
    expect(displaySyncLevel({ ...okDisplay, status: 'connecting' })).toBe('down');
    expect(displaySyncLevel({ ...okDisplay, controllerConnected: false })).toBe('down');
    expect(displaySyncLevel({ ...okDisplay, hasSnapshot: false })).toBe('down');
    expect(displaySyncLevel({ ...okDisplay, lastSnapshotAt: now - 31_000 })).toBe('down');
  });
});

describe('libellés (lecteurs d’écran uniquement, rien d’affiché)', () => {
  it('describes each level', () => {
    expect(syncLevelLabel('ok')).toMatch(/OK/);
    expect(syncLevelLabel('slow')).toMatch(/lente|latence/i);
    expect(syncLevelLabel('down')).toMatch(/interrompue/i);
  });
});
