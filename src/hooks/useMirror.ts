import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { APP_VERSION } from '../changelog';
import {
  clearMirrorDiagnostics,
  getMirrorDiagnostics,
  logMirrorEvent,
  setMirrorDiagContext,
  subscribeMirrorDiagnostics,
  type MirrorDiagLevel,
} from '../mirror/diagnostics';
import {
  buildSnapshot,
  generateRoomCode,
  generateRoomSecret,
  inspectServerPayload,
  nextPushSeq,
  remainingFromSnapshot,
  seqFromWelcome,
  toWireSnapshot,
  welcomeDroppedSnapshot,
  WS_CLOSE_ROOM_BUSY,
  type MirrorSnapshot,
} from '../mirror/protocol';
import { clearMirrorSession, loadMirrorSession, saveMirrorSession } from '../mirror/storage';
import {
  DISPLAY_SNAPSHOT_WAIT_MS,
  controllerSyncStatus,
  displaySyncStatus,
  type ControllerSyncView,
  type DisplaySyncView,
  type MirrorConnectionStatus,
} from '../mirror/syncStatus';
import { themeBodyClass } from '../timer/engine';
import type { EngineState, TimerConfig } from '../timer/types';
import { buildMirrorWsUrl, getMirrorRelayHost } from '../mirror/wsUrl';

export type { MirrorConnectionStatus };

export function useMirrorDiagnostics() {
  return useSyncExternalStore(subscribeMirrorDiagnostics, getMirrorDiagnostics, getMirrorDiagnostics);
}

function emitDiag(
  role: 'controller' | 'display',
  room: string | null,
  level: MirrorDiagLevel,
  code: string,
  message: string,
  seq?: number,
): void {
  logMirrorEvent({ ts: Date.now(), role, room, level, code, message, seq });
}

interface UseControllerMirrorOptions {
  enabled: boolean;
  state: EngineState;
  config: TimerConfig;
}

export function useControllerMirror({ enabled, state, config }: UseControllerMirrorOptions) {
  const [room, setRoom] = useState<string | null>(null);
  const [status, setStatus] = useState<MirrorConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(0);
  const [lastPushOkAt, setLastPushOkAt] = useState<number | null>(null);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [lastSeq, setLastSeq] = useState<number | null>(null);
  const [liveSince, setLiveSince] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const seqRef = useRef(0);
  const pushReadyRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const roomRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  const configRef = useRef(config);
  stateRef.current = state;
  configRef.current = config;

  const sendSnapshot = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!pushReadyRef.current) return;
    seqRef.current = nextPushSeq(seqRef.current);
    const seq = seqRef.current;
    setLastSeq(seq);
    socket.send(
      JSON.stringify({
        type: 'push',
        seq,
        snapshot: toWireSnapshot(buildSnapshot(stateRef.current, configRef.current, Date.now())),
      }),
    );
    emitDiag('controller', roomRef.current, 'info', 'push', `push seq=${seq}`, seq);
  }, []);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    socketRef.current = null;
  }, []);

  const connect = useCallback(
    (nextRoom: string, secret: string) => {
      const url = buildMirrorWsUrl(nextRoom, 'controller', secret);
      if (!url) {
        setStatus('error');
        setError('Relais non configuré (VITE_MIRROR_WS_URL).');
        setLastErrorCode('relay_unconfigured');
        emitDiag('controller', nextRoom, 'error', 'relay_unconfigured', 'VITE_MIRROR_WS_URL manquant');
        return;
      }

      stop();
      seqRef.current = 0;
      pushReadyRef.current = false;
      roomRef.current = nextRoom;
      setRoom(nextRoom);
      setStatus('connecting');
      setError(null);
      setLastErrorCode(null);
      setLastPushOkAt(null);
      setLastSeq(0);
      setLiveSince(null);
      saveMirrorSession(nextRoom, secret);
      emitDiag(
        'controller',
        nextRoom,
        'info',
        'connect',
        `connexion ${getMirrorRelayHost() ?? 'relais'} role=controller`,
      );

      let cancelled = false;
      let fatal = false;
      let retryMs = 500;
      let retryTimer: number | null = null;

      const markFatal = (code: string, message: string) => {
        fatal = true;
        cancelled = true;
        pushReadyRef.current = false;
        setStatus('error');
        setError(message);
        setLastErrorCode(code);
      };

      const open = () => {
        const ws = new WebSocket(url);
        socketRef.current = ws;
        ws.onopen = () => {
          retryMs = 500;
          setStatus('live');
          setError(null);
          setLiveSince(Date.now());
          emitDiag('controller', nextRoom, 'info', 'ws_open', 'WebSocket ouvert');
        };
        ws.onerror = () => {
          emitDiag('controller', nextRoom, 'error', 'connect_fail', 'échec WebSocket');
          setLastErrorCode('connect_fail');
        };
        ws.onmessage = (event) => {
          const inspected = inspectServerPayload(String(event.data));
          if (!inspected.parsed) {
            emitDiag('controller', nextRoom, 'error', inspected.code, inspected.preview);
            setLastErrorCode(inspected.code);
            setError(inspected.preview);
            return;
          }
          const message = inspected.parsed;
          switch (message.type) {
            case 'welcome': {
              seqRef.current = seqFromWelcome(message.seq);
              pushReadyRef.current = true;
              setLastSeq(message.seq);
              setDisplayCount(message.displayCount);
              emitDiag(
                'controller',
                nextRoom,
                'info',
                'welcome',
                `seq=${message.seq} displays=${message.displayCount} snapshot=${message.snapshot ? 'yes' : 'no'}`,
                message.seq,
              );
              sendSnapshot();
              break;
            }
            case 'peers':
              setDisplayCount(message.displayCount);
              emitDiag(
                'controller',
                nextRoom,
                'info',
                'peers',
                `displays=${message.displayCount} controller=${message.controllerConnected ? 'yes' : 'no'}`,
              );
              break;
            case 'push_ok':
              setLastPushOkAt(Date.now());
              setLastErrorCode(null);
              setError(null);
              emitDiag('controller', nextRoom, 'info', 'push_ok', `seq=${message.seq}`, message.seq);
              break;
            case 'error':
              setLastErrorCode(message.code);
              setError(message.message);
              emitDiag('controller', nextRoom, 'error', message.code, message.message);
              if (message.code === 'room_busy' || message.code === 'unauthorized') {
                markFatal(message.code, message.message);
                wsSafeClose(ws);
              }
              break;
            case 'snapshot':
            case 'pong':
              break;
            default: {
              const exhaustive: never = message;
              return exhaustive;
            }
          }
        };
        ws.onclose = (event) => {
          pushReadyRef.current = false;
          emitDiag(
            'controller',
            nextRoom,
            event.code === WS_CLOSE_ROOM_BUSY ? 'error' : 'warn',
            'ws_close',
            `code=${event.code}${event.reason ? ` reason=${event.reason}` : ''}`,
          );
          if (cancelled || fatal) return;
          if (event.code === WS_CLOSE_ROOM_BUSY) {
            markFatal('room_busy', 'Cette salle a déjà une télécommande.');
            return;
          }
          setStatus('connecting');
          setLastPushOkAt(null);
          retryTimer = window.setTimeout(open, retryMs);
          retryMs = Math.min(retryMs * 2, 8000);
        };
      };

      open();
      stopRef.current = () => {
        cancelled = true;
        if (retryTimer !== null) window.clearTimeout(retryTimer);
        wsSafeClose(socketRef.current);
      };
    },
    [sendSnapshot, stop],
  );

  const closeRoom = useCallback(() => {
    stop();
    seqRef.current = 0;
    pushReadyRef.current = false;
    roomRef.current = null;
    clearMirrorSession();
    setRoom(null);
    setDisplayCount(0);
    setLastPushOkAt(null);
    setLastSeq(null);
    setLiveSince(null);
    setStatus('idle');
    setError(null);
    setLastErrorCode(null);
  }, [stop]);

  const createRoom = useCallback(() => {
    clearMirrorDiagnostics();
    connect(generateRoomCode(), generateRoomSecret());
  }, [connect]);

  useEffect(() => {
    if (!enabled) {
      closeRoom();
      return undefined;
    }
    const existing = loadMirrorSession();
    if (existing) connect(existing.room, existing.secret);
    return () => stop();
  }, [enabled, connect, closeRoom, stop]);

  useEffect(() => {
    if (status !== 'live') return undefined;
    sendSnapshot();
    if (!state.isRunning) return undefined;
    const id = window.setInterval(sendSnapshot, 2000);
    return () => window.clearInterval(id);
  }, [
    status,
    sendSnapshot,
    state.isRunning,
    state.currentPlayer,
    state.shotKind,
    state.expectedTime,
    state.isExtensionUsedForShot,
    state.extensionsUsedInGame,
    state.isRunning ? null : state.remainingTime,
    config,
  ]);

  useEffect(() => {
    if (status !== 'live') return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    setMirrorDiagContext({
      version: APP_VERSION,
      relayHost: getMirrorRelayHost() ?? null,
      role: 'controller',
      room,
      status,
      lastSeq,
      snapshotReceived: lastPushOkAt != null,
      displayCount,
      lastPushOkAt,
      lastErrorCode,
    });
  }, [room, status, lastSeq, lastPushOkAt, displayCount, lastErrorCode]);

  const sync: ControllerSyncView = useMemo(
    () =>
      controllerSyncStatus({
        status,
        error,
        displayCount,
        lastPushOkAt,
        liveSince,
        now,
        room,
        lastErrorCode,
      }),
    [status, error, displayCount, lastPushOkAt, liveSince, now, room, lastErrorCode],
  );

  return {
    room,
    status,
    error,
    displayCount,
    lastPushOkAt,
    lastErrorCode,
    sync,
    createRoom,
    closeRoom,
  };
}

export function useDisplayMirror(room: string) {
  const [status, setStatus] = useState<MirrorConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<MirrorSnapshot | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [controllerConnected, setControllerConnected] = useState(false);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<number | null>(null);
  const [lastSeq, setLastSeq] = useState<number | null>(null);
  const [liveSince, setLiveSince] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const snapshotRef = useRef<{ snapshot: MirrorSnapshot; receivedAt: number } | null>(null);

  useEffect(() => {
    const url = buildMirrorWsUrl(room, 'display');
    if (!url) {
      setStatus('error');
      setError('Relais non configuré (VITE_MIRROR_WS_URL).');
      setLastErrorCode('relay_unconfigured');
      emitDiag('display', room, 'error', 'relay_unconfigured', 'VITE_MIRROR_WS_URL manquant');
      return undefined;
    }

    const applySnapshot = (next: MirrorSnapshot, seq?: number) => {
      const receivedAt = Date.now();
      snapshotRef.current = { snapshot: next, receivedAt };
      setSnapshot(next);
      setLastSnapshotAt(receivedAt);
      if (seq != null) setLastSeq(seq);
      setRemainingTime(remainingFromSnapshot(next, receivedAt, receivedAt));
    };

    emitDiag('display', room, 'info', 'connect', `connexion ${getMirrorRelayHost() ?? 'relais'} role=display`);

    let cancelled = false;
    let retryMs = 500;
    let retryTimer: number | null = null;
    let pingTimer: number | null = null;
    let ws: WebSocket | null = null;

    const open = () => {
      ws = new WebSocket(url);
      ws.onopen = () => {
        retryMs = 500;
        setStatus('live');
        setError(null);
        setLiveSince(Date.now());
        setNow(Date.now());
        emitDiag('display', room, 'info', 'ws_open', 'WebSocket ouvert');
        pingTimer = window.setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 10_000);
      };
      ws.onerror = () => {
        emitDiag('display', room, 'error', 'connect_fail', 'échec WebSocket');
        setLastErrorCode('connect_fail');
      };
      ws.onmessage = (event) => {
        const rawText = String(event.data);
        const inspected = inspectServerPayload(rawText);
        if (!inspected.parsed) {
          emitDiag('display', room, 'error', inspected.code, inspected.preview);
          setLastErrorCode(inspected.code);
          setError(inspected.preview);
          return;
        }
        const message = inspected.parsed;
        switch (message.type) {
          case 'welcome': {
            setControllerConnected(message.controllerConnected);
            setLastSeq(message.seq);
            if (message.snapshot) applySnapshot(message.snapshot, message.seq);
            else {
              try {
                if (welcomeDroppedSnapshot(JSON.parse(rawText), message)) {
                  emitDiag('display', room, 'error', 'invalid_snapshot', 'welcome snapshot rejeté');
                  setLastErrorCode('invalid_snapshot');
                }
              } catch {
                // ignore
              }
            }
            emitDiag(
              'display',
              room,
              'info',
              'welcome',
              `seq=${message.seq} controller=${message.controllerConnected ? 'yes' : 'no'} snapshot=${message.snapshot ? 'yes' : 'no'}`,
              message.seq,
            );
            break;
          }
          case 'snapshot':
            applySnapshot(message.snapshot, message.seq);
            emitDiag('display', room, 'info', 'snapshot', `seq=${message.seq}`, message.seq);
            break;
          case 'peers':
            setControllerConnected(message.controllerConnected);
            emitDiag(
              'display',
              room,
              'info',
              'peers',
              `displays=${message.displayCount} controller=${message.controllerConnected ? 'yes' : 'no'}`,
            );
            break;
          case 'error':
            setStatus('error');
            setError(message.message);
            setLastErrorCode(message.code);
            emitDiag('display', room, 'error', message.code, message.message);
            break;
          case 'push_ok':
          case 'pong':
            break;
          default: {
            const exhaustive: never = message;
            return exhaustive;
          }
        }
      };
      ws.onclose = (event) => {
        if (pingTimer !== null) {
          window.clearInterval(pingTimer);
          pingTimer = null;
        }
        emitDiag(
          'display',
          room,
          'warn',
          'ws_close',
          `code=${event.code}${event.reason ? ` reason=${event.reason}` : ''}`,
        );
        if (cancelled) return;
        setStatus('connecting');
        setLiveSince(null);
        retryTimer = window.setTimeout(open, retryMs);
        retryMs = Math.min(retryMs * 2, 8000);
      };
    };

    open();
    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (pingTimer !== null) window.clearInterval(pingTimer);
      wsSafeClose(ws);
    };
  }, [room]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = snapshotRef.current;
      const tick = Date.now();
      setNow(tick);
      if (!current) return;
      setRemainingTime(remainingFromSnapshot(current.snapshot, tick, current.receivedAt));
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (status !== 'live' || snapshot) return undefined;
    const id = window.setTimeout(() => {
      emitDiag('display', room, 'warn', 'no_snapshot', 'Aucun snapshot reçu');
      setLastErrorCode((current) => current ?? 'no_snapshot');
    }, DISPLAY_SNAPSHOT_WAIT_MS);
    return () => window.clearTimeout(id);
  }, [status, snapshot, room]);

  useEffect(() => {
    if (!snapshot) return;
    const className = themeBodyClass(snapshot.config.theme);
    document.body.classList.remove('theme-light', 'theme-cyberpunk', 'theme-ffb', 'theme-fbep');
    if (className) document.body.classList.add(className);
  }, [snapshot]);

  useEffect(() => {
    setMirrorDiagContext({
      version: APP_VERSION,
      relayHost: getMirrorRelayHost() ?? null,
      role: 'display',
      room,
      status,
      lastSeq,
      snapshotReceived: snapshot != null,
      displayCount: null,
      lastPushOkAt: lastSnapshotAt,
      lastErrorCode,
    });
  }, [room, status, lastSeq, snapshot, lastSnapshotAt, lastErrorCode]);

  const sync: DisplaySyncView = useMemo(
    () =>
      displaySyncStatus({
        status,
        error,
        hasSnapshot: snapshot != null,
        lastSnapshotAt,
        liveSince,
        now,
        lastErrorCode,
      }),
    [status, error, snapshot, lastSnapshotAt, liveSince, now, lastErrorCode],
  );

  return {
    status,
    error,
    snapshot,
    remainingTime,
    controllerConnected,
    lastSnapshotAt,
    lastErrorCode,
    sync,
  };
}

function wsSafeClose(ws: WebSocket | null): void {
  if (!ws) return;
  try {
    ws.close();
  } catch {
    // ignore
  }
}
