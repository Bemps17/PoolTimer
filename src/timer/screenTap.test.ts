import { describe, expect, it } from 'vitest';
import {
  createScreenTapSession,
  resolveTimerScreenTap,
  shouldAcceptControlActivation,
} from './screenTap';

describe('resolveTimerScreenTap', () => {
  it('pauses immediately on the first tap while running', () => {
    const first = resolveTimerScreenTap({
      isRunning: true,
      now: 1_000,
      kind: 'pointer',
      session: createScreenTapSession(),
    });
    expect(first.action).toBe('pause');
  });

  it('ignores a synthetic click after a touch pointerup so pause is not undone', () => {
    const paused = resolveTimerScreenTap({
      isRunning: true,
      now: 1_000,
      kind: 'pointer',
      session: createScreenTapSession(),
    });
    const ghost = resolveTimerScreenTap({
      isRunning: false,
      now: 1_080,
      kind: 'click',
      session: paused.session,
    });
    expect(ghost.action).toBe('ignore');
  });

  it('does not treat a second event just after pause as double-tap reset', () => {
    const paused = resolveTimerScreenTap({
      isRunning: true,
      now: 1_000,
      kind: 'pointer',
      session: createScreenTapSession(),
    });
    const secondPointer = resolveTimerScreenTap({
      isRunning: false,
      now: 1_120,
      kind: 'pointer',
      session: paused.session,
    });
    expect(secondPointer.action).toBe('ignore');
  });

  it('ignores a second tap while isRunning is still true after pause (stale UI state)', () => {
    const paused = resolveTimerScreenTap({
      isRunning: true,
      now: 1_000,
      kind: 'pointer',
      session: createScreenTapSession(),
    });
    const staleRunning = resolveTimerScreenTap({
      isRunning: true,
      now: 1_080,
      kind: 'pointer',
      session: paused.session,
    });
    expect(staleRunning.action).toBe('ignore');
  });

  it('arms play on a single tap when paused, and resets on a true double-tap', () => {
    const first = resolveTimerScreenTap({
      isRunning: false,
      now: 5_000,
      kind: 'pointer',
      session: createScreenTapSession(),
    });
    expect(first.action).toBe('arm-play');

    const second = resolveTimerScreenTap({
      isRunning: false,
      now: 5_200,
      kind: 'pointer',
      session: first.session,
    });
    expect(second.action).toBe('reset');
  });
});

describe('shouldAcceptControlActivation', () => {
  it('accepts the pointer and drops the following click on the play/pause button', () => {
    const pointer = shouldAcceptControlActivation('pointer', 1_000, 0);
    expect(pointer.accept).toBe(true);
    const click = shouldAcceptControlActivation('click', 1_050, pointer.lastPointerAt);
    expect(click.accept).toBe(false);
  });

  it('still accepts a keyboard/mouse click with no prior pointer', () => {
    expect(shouldAcceptControlActivation('click', 1_000, 0).accept).toBe(true);
  });

  it('drops a second pointer on the play/pause button within the pause guard', () => {
    const first = shouldAcceptControlActivation('pointer', 1_000, 0);
    expect(first.accept).toBe(true);
    const second = shouldAcceptControlActivation('pointer', 1_100, first.lastPointerAt);
    expect(second.accept).toBe(false);
  });
});
