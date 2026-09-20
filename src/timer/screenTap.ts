export const DOUBLE_TAP_MS = 320;
export const GHOST_CLICK_MS = 700;
export const PAUSE_GUARD_MS = 400;

export type TapKind = 'pointer' | 'click';
export type TapAction = 'pause' | 'arm-play' | 'reset' | 'ignore';

export interface ScreenTapSession {
  lastPointerAt: number;
  lastTapAt: number;
  pendingPlayUntil: number;
  pausedFromRunningAt: number;
}

export function createScreenTapSession(): ScreenTapSession {
  return { lastPointerAt: 0, lastTapAt: 0, pendingPlayUntil: 0, pausedFromRunningAt: 0 };
}

export function isGhostClick(kind: TapKind, now: number, lastPointerAt: number): boolean {
  return kind === 'click' && lastPointerAt > 0 && now - lastPointerAt < GHOST_CLICK_MS;
}

export function shouldAcceptControlActivation(
  kind: TapKind,
  now: number,
  lastPointerAt: number,
): { accept: boolean; lastPointerAt: number } {
  if (lastPointerAt > 0 && now - lastPointerAt < PAUSE_GUARD_MS) {
    return { accept: false, lastPointerAt };
  }
  if (isGhostClick(kind, now, lastPointerAt)) {
    return { accept: false, lastPointerAt };
  }
  return { accept: true, lastPointerAt: now };
}

export function resolveTimerScreenTap(input: {
  isRunning: boolean;
  now: number;
  kind: TapKind;
  session: ScreenTapSession;
  doubleTapMs?: number;
  pauseGuardMs?: number;
}): { action: TapAction; session: ScreenTapSession } {
  const doubleTapMs = input.doubleTapMs ?? DOUBLE_TAP_MS;
  const pauseGuardMs = input.pauseGuardMs ?? PAUSE_GUARD_MS;
  let session = { ...input.session };

  if (isGhostClick(input.kind, input.now, session.lastPointerAt)) {
    return { action: 'ignore', session };
  }
  if (input.kind === 'pointer') {
    session.lastPointerAt = input.now;
  }

  // Extra pointer/click can arrive before React flips isRunning. Ignore them so
  // they cannot toggle play back on or fire reset + autoStartOnReset.
  if (session.pausedFromRunningAt > 0 && input.now - session.pausedFromRunningAt < pauseGuardMs) {
    return { action: 'ignore', session };
  }

  if (input.isRunning) {
    session.lastTapAt = input.now;
    session.pausedFromRunningAt = input.now;
    session.pendingPlayUntil = 0;
    return { action: 'pause', session };
  }

  const isDoubleTap =
    (session.pendingPlayUntil > 0 && input.now <= session.pendingPlayUntil) ||
    (session.lastTapAt > 0 && input.now - session.lastTapAt < doubleTapMs);

  if (isDoubleTap) {
    session.lastTapAt = 0;
    session.pendingPlayUntil = 0;
    session.pausedFromRunningAt = 0;
    return { action: 'reset', session };
  }

  session.lastTapAt = input.now;
  session.pendingPlayUntil = input.now + doubleTapMs;
  session.pausedFromRunningAt = 0;
  return { action: 'arm-play', session };
}
