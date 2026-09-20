export type MirrorDiagLevel = 'info' | 'warn' | 'error';

export interface MirrorDiagEvent {
  ts: number;
  level: MirrorDiagLevel;
  code: string;
  role: 'controller' | 'display';
  room: string | null;
  message: string;
  seq?: number;
}

export interface MirrorDiagContext {
  version: string;
  relayHost: string | null;
  role: 'controller' | 'display' | null;
  room: string | null;
  status: string;
  lastSeq: number | null;
  snapshotReceived: boolean;
  displayCount: number | null;
  lastPushOkAt: number | null;
  lastErrorCode: string | null;
}

export interface MirrorDiagState extends MirrorDiagContext {
  events: MirrorDiagEvent[];
}

const MAX_EVENTS = 80;

function defaultContext(): MirrorDiagContext {
  return {
    version: '',
    relayHost: null,
    role: null,
    room: null,
    status: 'idle',
    lastSeq: null,
    snapshotReceived: false,
    displayCount: null,
    lastPushOkAt: null,
    lastErrorCode: null,
  };
}

let context = defaultContext();
let events: MirrorDiagEvent[] = [];
let snapshot: MirrorDiagState = { ...context, events };
const listeners = new Set<() => void>();

function publish(): void {
  snapshot = { ...context, events };
  for (const listener of listeners) listener();
}

export function getMirrorDiagnostics(): MirrorDiagState {
  return snapshot;
}

export function subscribeMirrorDiagnostics(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearMirrorDiagnostics(): void {
  context = defaultContext();
  events = [];
  publish();
}

export function setMirrorDiagContext(partial: Partial<MirrorDiagContext>): void {
  context = { ...context, ...partial };
  publish();
}

export function logMirrorEvent(event: MirrorDiagEvent): void {
  events = [...events.slice(-(MAX_EVENTS - 1)), event];
  if (event.level === 'error') {
    context = { ...context, lastErrorCode: event.code };
  }
  publish();
}

function padLevel(level: MirrorDiagLevel): string {
  return level.toUpperCase().padEnd(5, ' ');
}

export function formatMirrorDiagnostics(state: MirrorDiagState = getMirrorDiagnostics()): string {
  const lines = [
    `H8timer v${state.version || '?'} — logs miroir`,
    `relayHost: ${state.relayHost ?? '—'}`,
    `role: ${state.role ?? '—'}`,
    `room: ${state.room ?? '—'}`,
    `status: ${state.status}`,
    `seq: ${state.lastSeq ?? '—'}`,
    `snapshotReceived: ${state.snapshotReceived ? 'yes' : 'no'}`,
    `displayCount: ${state.displayCount ?? '—'}`,
    `lastPushOkAt: ${state.lastPushOkAt == null ? '—' : new Date(state.lastPushOkAt).toISOString()}`,
    `lastError: ${state.lastErrorCode ?? '—'}`,
    '---',
  ];
  for (const event of state.events) {
    const seq = event.seq != null ? ` seq=${event.seq}` : '';
    lines.push(`${new Date(event.ts).toISOString()}  ${padLevel(event.level)} ${event.code}  ${event.message}${seq}`);
  }
  return lines.join('\n');
}
