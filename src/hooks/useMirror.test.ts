import { describe, expect, it } from 'vitest';
import { getDefaultConfig } from '../timer/config';
import { createInitialState, pauseTimer, startTimer } from '../timer/engine';
import { buildSnapshot, nextPushSeq, remainingFromSnapshot, seqFromWelcome } from '../mirror/protocol';

describe('useDisplayMirror remaining interpolation', () => {
  it('counts down from local receive-time while running, even if clocks disagree', () => {
    const config = getDefaultConfig();
    const snapshot = buildSnapshot(startTimer(createInitialState(config), 1_000), config, 1_000);
    const receivedAt = Date.now() + 86_400_000;

    expect(remainingFromSnapshot(snapshot, receivedAt, receivedAt)).toBe(45_000);
    expect(remainingFromSnapshot(snapshot, receivedAt + 1_000, receivedAt)).toBe(44_000);
  });

  it('stays frozen at remainingTime while paused', () => {
    const config = getDefaultConfig();
    const running = startTimer(createInitialState(config), 1_000);
    const paused = pauseTimer(running, 6_000);
    const snapshot = buildSnapshot(paused, config, 6_000);
    const receivedAt = 50_000;

    expect(snapshot.isRunning).toBe(false);
    expect(remainingFromSnapshot(snapshot, receivedAt, receivedAt)).toBe(40_000);
    expect(remainingFromSnapshot(snapshot, receivedAt + 8_000, receivedAt)).toBe(40_000);
  });
});

describe('useControllerMirror seq sync', () => {
  it('starts the next push at welcome.seq + 1 after reconnect', () => {
    const welcomeSeq = seqFromWelcome(12);
    expect(nextPushSeq(welcomeSeq)).toBe(13);
    expect(nextPushSeq(nextPushSeq(welcomeSeq))).toBe(14);
  });
});
