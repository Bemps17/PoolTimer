export const DOUBLE_TAP_MS = 320;
export const GHOST_CLICK_MS = 700;
export const PAUSE_GUARD_MS = 400;

export type TapKind = 'pointer' | 'click';
export type TapAction = 'arm-pause' | 'arm-play' | 'reset' | 'ignore';

export interface ScreenTapSession {
  lastPointerAt: number;
  lastTapAt: number;
  pendingUntil: number;
}

export function createScreenTapSession(): ScreenTapSession {
  return { lastPointerAt: 0, lastTapAt: 0, pendingUntil: 0 };
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
}): { action: TapAction; session: ScreenTapSession } {
  const doubleTapMs = input.doubleTapMs ?? DOUBLE_TAP_MS;
  let session = { ...input.session };

  if (isGhostClick(input.kind, input.now, session.lastPointerAt)) {
    return { action: 'ignore', session };
  }
  if (input.kind === 'pointer') {
    session.lastPointerAt = input.now;
  }

  const isDoubleTap =
    (session.pendingUntil > 0 && input.now <= session.pendingUntil) ||
    (session.lastTapAt > 0 && input.now - session.lastTapAt < doubleTapMs);

  if (isDoubleTap) {
    session.lastTapAt = 0;
    session.pendingUntil = 0;
    return { action: 'reset', session };
  }

  session.lastTapAt = input.now;
  session.pendingUntil = input.now + doubleTapMs;
  return { action: input.isRunning ? 'arm-pause' : 'arm-play', session };
}
