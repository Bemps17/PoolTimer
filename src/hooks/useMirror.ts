import { useCallback, useEffect, useRef, useState } from 'react';
import { themeBodyClass } from '../timer/engine';
import type { EngineState, TimerConfig } from '../timer/types';
import {
  buildSnapshot,
  generateRoomCode,
  generateRoomSecret,
  parseServerMessage,
  remainingFromSnapshot,
  type MirrorSnapshot,
} from '../mirror/protocol';
import { clearMirrorSession, loadMirrorSession, saveMirrorSession } from '../mirror/storage';
import { buildMirrorWsUrl } from '../mirror/wsUrl';

export type MirrorConnectionStatus = 'idle' | 'connecting' | 'live' | 'error';

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
  const seqRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const stateRef = useRef(state);
  const configRef = useRef(config);
  stateRef.current = state;
  configRef.current = config;

  const sendSnapshot = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    seqRef.current += 1;
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
      setRoom(nextRoom);
      setStatus('connecting');
      setError(null);
      saveMirrorSession(nextRoom, secret);

      let cancelled = false;
      let retryMs = 500;
      let retryTimer: number | null = null;

      const open = () => {
        const ws = new WebSocket(url);
        socketRef.current = ws;
        ws.onopen = () => {
          retryMs = 500;
          setStatus('live');
          setError(null);
          sendSnapshot();
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
            case 'peers':
              setDisplayCount(message.displayCount);
              break;
            case 'error':
              setStatus('error');
              setError(message.message);
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
        ws.onclose = () => {
          if (cancelled) return;
          setStatus('connecting');
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
    clearMirrorSession();
    setRoom(null);
    setDisplayCount(0);
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
    config,
  ]);

  return {
    room,
    status,
    error,
    displayCount,
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
  const snapshotRef = useRef<MirrorSnapshot | null>(null);

  useEffect(() => {
    const url = buildMirrorWsUrl(room, 'display');
    if (!url) {
      setStatus('error');
      setError('Relais non configuré (VITE_MIRROR_WS_URL).');
      return undefined;
    }

    let cancelled = false;
    let retryMs = 500;
    let retryTimer: number | null = null;
    let ws: WebSocket | null = null;

    const open = () => {
      ws = new WebSocket(url);
      ws.onopen = () => {
        retryMs = 500;
        setStatus('live');
        setError(null);
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
            if (message.snapshot) {
              snapshotRef.current = message.snapshot;
              setSnapshot(message.snapshot);
              setRemainingTime(remainingFromSnapshot(message.snapshot, Date.now()));
            }
            break;
          case 'snapshot':
            snapshotRef.current = message.snapshot;
            setSnapshot(message.snapshot);
            setRemainingTime(remainingFromSnapshot(message.snapshot, Date.now()));
            break;
          case 'peers':
            setControllerConnected(message.controllerConnected);
            break;
          case 'error':
            setStatus('error');
            setError(message.message);
            break;
          case 'pong':
            break;
          default: {
            const exhaustive: never = message;
            return exhaustive;
          }
        }
      };
      ws.onclose = () => {
        if (cancelled) return;
        setStatus('connecting');
        retryTimer = window.setTimeout(open, retryMs);
        retryMs = Math.min(retryMs * 2, 8000);
      };
    };

    open();
    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      wsSafeClose(ws);
    };
  }, [room]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = snapshotRef.current;
      if (!current) return;
      setRemainingTime(remainingFromSnapshot(current, Date.now()));
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    const className = themeBodyClass(snapshot.config.theme);
    document.body.classList.remove('theme-light', 'theme-cyberpunk', 'theme-ffb', 'theme-fbep');
    if (className) document.body.classList.add(className);
  }, [snapshot]);

  return { status, error, snapshot, remainingTime, controllerConnected };
}

function wsSafeClose(ws: WebSocket | null): void {
  if (!ws) return;
  try {
    ws.close();
  } catch {
    // ignore
  }
}
