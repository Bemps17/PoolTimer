import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyThemeToDocument } from '../timer/engine';
import type { EngineState, TimerConfig } from '../timer/types';
import {
  buildSnapshot,
  generateRoomCode,
  generateRoomSecret,
  nextPushSeq,
  parseServerMessage,
  remainingFromSnapshot,
  seqFromWelcome,
  WS_CLOSE_ROOM_BUSY,
  type MirrorSnapshot,
} from '../mirror/protocol';
import { clearMirrorSession, loadMirrorSession, saveMirrorSession } from '../mirror/storage';
import {
  controllerSyncStatus,
  displaySyncStatus,
  type ControllerSyncView,
  type DisplaySyncView,
  type MirrorConnectionStatus,
} from '../mirror/syncStatus';
import { buildMirrorWsUrl } from '../mirror/wsUrl';

export type { MirrorConnectionStatus };

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
  const [liveSince, setLiveSince] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const seqRef = useRef(0);
  const pushReadyRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const stateRef = useRef(state);
  const configRef = useRef(config);
  stateRef.current = state;
  configRef.current = config;

  const sendSnapshot = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!pushReadyRef.current) return;
    seqRef.current = nextPushSeq(seqRef.current);
    socket.send(
      JSON.stringify({
        type: 'push',
        seq: seqRef.current,
        snapshot: buildSnapshot(stateRef.current, configRef.current, Date.now()),
      }),
    );
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
        return;
      }

      stop();
      seqRef.current = 0;
      pushReadyRef.current = false;
      setRoom(nextRoom);
      setStatus('connecting');
      setError(null);
      setLastPushOkAt(null);
      setLiveSince(null);
      saveMirrorSession(nextRoom, secret);

      let cancelled = false;
      let fatal = false;
      let retryMs = 500;
      let retryTimer: number | null = null;

      const markFatal = (message: string) => {
        fatal = true;
        cancelled = true;
        pushReadyRef.current = false;
        setStatus('error');
        setError(message);
      };

      const open = () => {
        const ws = new WebSocket(url);
        socketRef.current = ws;
        ws.onopen = () => {
          retryMs = 500;
          setStatus('live');
          setError(null);
          setLiveSince(Date.now());
        };
        ws.onmessage = (event) => {
          let parsed: unknown;
          try {
            parsed = JSON.parse(String(event.data));
          } catch {
            return;
          }
          const message = parseServerMessage(parsed);
          if (!message) return;
          switch (message.type) {
            case 'welcome':
              seqRef.current = seqFromWelcome(message.seq);
              pushReadyRef.current = true;
              setDisplayCount(message.displayCount);
              sendSnapshot();
              break;
            case 'peers':
              setDisplayCount(message.displayCount);
              break;
            case 'push_ok':
              setLastPushOkAt(Date.now());
              break;
            case 'error':
              if (message.code === 'room_busy' || message.code === 'unauthorized') {
                markFatal(message.message);
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
          if (cancelled || fatal) return;
          if (event.code === WS_CLOSE_ROOM_BUSY) {
            markFatal('Cette salle a déjà une télécommande.');
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
    clearMirrorSession();
    setRoom(null);
    setDisplayCount(0);
    setLastPushOkAt(null);
    setLiveSince(null);
    setStatus('idle');
    setError(null);
  }, [stop]);

  const createRoom = useCallback(() => {
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
      }),
    [status, error, displayCount, lastPushOkAt, liveSince, now, room],
  );

  return {
    room,
    status,
    error,
    displayCount,
    lastPushOkAt,
    sync,
    createRoom,
    closeRoom,
  };
}

export function useDisplayMirror(room: string) {
  const [status, setStatus] = useState<MirrorConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<MirrorSnapshot | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [controllerConnected, setControllerConnected] = useState(false);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<number | null>(null);
  const [liveSince, setLiveSince] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const snapshotRef = useRef<{ snapshot: MirrorSnapshot; receivedAt: number } | null>(null);

  useEffect(() => {
    const url = buildMirrorWsUrl(room, 'display');
    if (!url) {
      setStatus('error');
      setError('Relais non configuré (VITE_MIRROR_WS_URL).');
      return undefined;
    }

    const applySnapshot = (next: MirrorSnapshot) => {
      const receivedAt = Date.now();
      snapshotRef.current = { snapshot: next, receivedAt };
      setSnapshot(next);
      setLastSnapshotAt(receivedAt);
      setRemainingTime(remainingFromSnapshot(next, receivedAt, receivedAt));
    };

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
        pingTimer = window.setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 10_000);
      };
      ws.onmessage = (event) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(String(event.data));
        } catch {
          return;
        }
        const message = parseServerMessage(parsed);
        if (!message) return;
        switch (message.type) {
          case 'welcome':
            setControllerConnected(message.controllerConnected);
            if (message.snapshot) applySnapshot(message.snapshot);
            break;
          case 'snapshot':
            applySnapshot(message.snapshot);
            break;
          case 'peers':
            setControllerConnected(message.controllerConnected);
            break;
          case 'error':
            setStatus('error');
            setError(message.message);
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
      ws.onclose = () => {
        if (pingTimer !== null) {
          window.clearInterval(pingTimer);
          pingTimer = null;
        }
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
    if (!snapshot) return;
    applyThemeToDocument(snapshot.config.theme, snapshot.config.colors);
  }, [snapshot]);

  const sync: DisplaySyncView = useMemo(
    () =>
      displaySyncStatus({
        status,
        error,
        hasSnapshot: snapshot != null,
        lastSnapshotAt,
        liveSince,
        now,
      }),
    [status, error, snapshot, lastSnapshotAt, liveSince, now],
  );

  return {
    status,
    error,
    snapshot,
    remainingTime,
    controllerConnected,
    lastSnapshotAt,
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
