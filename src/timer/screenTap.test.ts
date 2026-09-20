import { describe, expect, it } from 'vitest';
import {
  DOUBLE_TAP_MS,
  createScreenTapSession,
  resolveTimerScreenTap,
  shouldAcceptControlActivation,
} from './screenTap';

describe('resolveTimerScreenTap', () => {
  it('arms pause on the first tap while running instead of pausing immediately', () => {
    const first = resolveTimerScreenTap({
      isRunning: true,
      now: 1_000,
      kind: 'pointer',
      session: createScreenTapSession(),
    });
    expect(first.action).toBe('arm-pause');
  });

  it('cancels the pending pause and resets when a second tap arrives within the double-tap window', () => {
    const first = resolveTimerScreenTap({
      isRunning: true,
      now: 1_000,
      kind: 'pointer',
      session: createScreenTapSession(),
    });
    const second = resolveTimerScreenTap({
      isRunning: true,
      now: 1_000 + DOUBLE_TAP_MS - 40,
      kind: 'pointer',
      session: first.session,
    });
    expect(second.action).toBe('reset');
  });

  it('ignores a synthetic click after a touch pointerup so it cannot steal the double-tap window', () => {
    const armed = resolveTimerScreenTap({
      isRunning: true,
      now: 1_000,
      kind: 'pointer',
      session: createScreenTapSession(),
    });
    const ghost = resolveTimerScreenTap({
      isRunning: true,
      now: 1_080,
      kind: 'click',
      session: armed.session,
    });
    expect(ghost.action).toBe('ignore');

    const secondPointer = resolveTimerScreenTap({
      isRunning: true,
      now: 1_200,
      kind: 'pointer',
      session: ghost.session,
    });
    expect(secondPointer.action).toBe('reset');
  });

  it('treats a later single tap as a new pending pause once the double-tap window has elapsed', () => {
    const first = resolveTimerScreenTap({
      isRunning: true,
      now: 1_000,
      kind: 'pointer',
      session: createScreenTapSession(),
    });
    const later = resolveTimerScreenTap({
      isRunning: true,
      now: 1_000 + DOUBLE_TAP_MS + 20,
      kind: 'pointer',
      session: first.session,
    });
    expect(later.action).toBe('arm-pause');
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

  it('ignores a ghost click after arming play so pause/play is not confirmed early', () => {
    const first = resolveTimerScreenTap({
      isRunning: false,
      now: 5_000,
      kind: 'pointer',
      session: createScreenTapSession(),
    });
    const ghost = resolveTimerScreenTap({
      isRunning: false,
      now: 5_060,
      kind: 'click',
      session: first.session,
    });
    expect(ghost.action).toBe('ignore');
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
