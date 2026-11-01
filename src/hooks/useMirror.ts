import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyThemeToDocument } from '../timer/engine';
import type { MatchState } from '../timer/match';
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
import { createLatencyStats } from '../diagnostics/log';
import { connectionLabel, displayLog, formatMs, remoteLog } from '../diagnostics/instances';
import { createLatencyTracker } from '../mirror/latency';
import { controllerSyncLevel, displaySyncLevel, syncLevelLabel, type SyncLevel } from '../mirror/syncLevel';
import { APP_VERSION } from '../changelog';
import { nextTickDelay } from '../timer/tickSchedule';
import { buildMirrorWsUrl } from '../mirror/wsUrl';

export type { MirrorConnectionStatus };

interface UseControllerMirrorOptions {
  enabled: boolean;
  state: EngineState;
  config: TimerConfig;
  match?: MatchState;
}

export function useControllerMirror({ enabled, state, config, match }: UseControllerMirrorOptions) {
  const [room, setRoom] = useState<string | null>(null);
  const [status, setStatus] = useState<MirrorConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(0);
  const [liveSince, setLiveSince] = useState<number | null>(null);
  const [level, setLevel] = useState<SyncLevel>('down');
  const seqRef = useRef(0);
  // Mesures sans re-rendu : accusés de réception, allers-retours, compteurs (diagnostic).
  const lastPushOkAtRef = useRef<number | null>(null);
  const sentAtRef = useRef(new Map<number, number>());
  const recentRtt = useRef(createLatencyStats(20));
  const allRtt = useRef(createLatencyStats(500));
  const countersRef = useRef({ pushes: 0, acks: 0, reconnects: 0, rateLimited: 0 });
  const statusRef = useRef<MirrorConnectionStatus>('idle');
  const displayCountRef = useRef(0);
  statusRef.current = status;
  displayCountRef.current = displayCount;
  const pushReadyRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const stateRef = useRef(state);
  const configRef = useRef(config);
  const matchRef = useRef(match);
  stateRef.current = state;
  configRef.current = config;
  matchRef.current = match;

  const sendSnapshot = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!pushReadyRef.current) return;
    seqRef.current = nextPushSeq(seqRef.current);
    const sentAt = Date.now();
    sentAtRef.current.set(seqRef.current, sentAt);
    // Borne la table : les accusés jamais reçus au-delà de 30 s sont oubliés (le voyant est déjà rouge).
    for (const [seq, at] of sentAtRef.current) if (sentAt - at > 30_000) sentAtRef.current.delete(seq);
    countersRef.current.pushes += 1;
    socket.send(
      JSON.stringify({
        type: 'push',
        seq: seqRef.current,
        snapshot: buildSnapshot(stateRef.current, configRef.current, Date.now(), matchRef.current),
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
      lastPushOkAtRef.current = null;
      sentAtRef.current.clear();
      setLiveSince(null);
      saveMirrorSession(nextRoom, secret);
      remoteLog().add('info', 'salle', `connexion à ${nextRoom}`);

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
        remoteLog().add('error', 'salle', message);
      };

      const open = () => {
        const ws = new WebSocket(url);
        socketRef.current = ws;
        ws.onopen = () => {
          retryMs = 500;
          setStatus('live');
          setError(null);
          setLiveSince(Date.now());
          remoteLog().add('info', 'ws', 'connecté au relais');
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
              if (message.displayCount !== displayCountRef.current) {
                remoteLog().add('info', 'écrans', `${message.displayCount} écran(s) lié(s)`);
              }
              setDisplayCount(message.displayCount);
              break;
            case 'push_ok': {
              const at = Date.now();
              lastPushOkAtRef.current = at;
              countersRef.current.acks += 1;
              const sentAt = sentAtRef.current.get(message.seq);
              if (sentAt !== undefined) {
                recentRtt.current.add(at - sentAt);
                allRtt.current.add(at - sentAt);
              }
              // Un accusé couvre tous les envois précédents (le relais traite dans l'ordre).
              for (const seq of sentAtRef.current.keys()) if (seq <= message.seq) sentAtRef.current.delete(seq);
              break;
            }
            case 'error':
              if (message.code === 'room_busy' || message.code === 'unauthorized') {
                markFatal(message.message);
                wsSafeClose(ws);
              } else if (message.code === 'rate_limited') {
                // Le dernier état a pu être freiné : le renvoyer pour que l'écran ne reste pas en retard.
                countersRef.current.rateLimited += 1;
                remoteLog().add('warn', 'relais', 'débit limité, renvoi du dernier état');
                window.setTimeout(sendSnapshot, 700);
              } else {
                remoteLog().add('warn', 'relais', `${message.code} ${message.message}`);
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
          countersRef.current.reconnects += 1;
          remoteLog().add('warn', 'ws', `coupé (code ${event.code}), reconnexion dans ${retryMs} ms`);
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
    lastPushOkAtRef.current = null;
    sentAtRef.current.clear();
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
    // Les changements partent immédiatement ; ce renvoi périodique ne sert qu'à rattraper un écran (batterie : 5 s).
    const id = window.setInterval(sendSnapshot, 5_000);
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
    match,
  ]);

  // Voyant : réévalué toutes les 2 s et à chaque changement d'état ; l'interface ne se redessine que s'il change.
  const [sync, setSync] = useState<ControllerSyncView>(() =>
    controllerSyncStatus({ status: 'idle', error: null, displayCount: 0, lastPushOkAt: null, liveSince: null, now: 0, room: null }),
  );
  const evaluate = useCallback(() => {
    const now = Date.now();
    const pending = [...sentAtRef.current.values()];
    const next = controllerSyncLevel({
      status: statusRef.current,
      displayCount: displayCountRef.current,
      rttMs: recentRtt.current.summary().medianMs,
      oldestUnackedAt: pending.length ? Math.min(...pending) : null,
      now,
    });
    setLevel((previous) => {
      if (previous !== next && room) {
        remoteLog().add(next === 'down' ? 'error' : next === 'slow' ? 'warn' : 'info', 'synchro', `${syncLevelLabel(next)} (aller-retour ${formatMs(recentRtt.current.summary().medianMs)})`);
      }
      return next;
    });
    const view = controllerSyncStatus({
      status,
      error,
      displayCount,
      lastPushOkAt: lastPushOkAtRef.current,
      liveSince,
      now,
      room,
    });
    setSync((previous) =>
      previous.chip === view.chip && previous.health === view.health && previous.detail === view.detail ? previous : view,
    );
  }, [status, error, displayCount, liveSince, room]);

  useEffect(() => {
    evaluate();
    if (!room) return undefined;
    const id = window.setInterval(evaluate, 2_000);
    // Bilan minute dans le journal (latence et volume d'échanges).
    const stats = window.setInterval(() => {
      const s = allRtt.current.summary();
      const c = countersRef.current;
      remoteLog().add('info', 'stats', `aller-retour médiane=${formatMs(s.medianMs)} p95=${formatMs(s.p95Ms)} max=${formatMs(s.maxMs)} envois=${c.pushes} accusés=${c.acks} reconnexions=${c.reconnects}`);
    }, 60_000);
    return () => {
      window.clearInterval(id);
      window.clearInterval(stats);
    };
  }, [evaluate, room]);

  const diagnostics = useCallback(() => {
    const s = allRtt.current.summary();
    const c = countersRef.current;
    const lastAck = lastPushOkAtRef.current;
    const rows: Array<[string, string]> = [
      ['Synchro', syncLevelLabel(level)],
      ['Salle', room ?? '—'],
      ['Connexion relais', connectionLabel(status)],
      ['Écrans liés', String(displayCount)],
      ['Aller-retour médiane', formatMs(s.medianMs)],
      ['Aller-retour p95 / max', `${formatMs(s.p95Ms)} / ${formatMs(s.maxMs)}`],
      ['Dernier accusé', lastAck ? `il y a ${Math.round((Date.now() - lastAck) / 1000)} s` : '—'],
      ['Envois / accusés', `${c.pushes} / ${c.acks}`],
      ['Reconnexions', String(c.reconnects)],
      ['Débit limité', String(c.rateLimited)],
    ];
    const buildLog = () =>
      remoteLog().toText({
        application: `H8timer ${APP_VERSION}`,
        rôle: 'télécommande',
        navigateur: typeof navigator === 'undefined' ? '—' : navigator.userAgent,
        ...Object.fromEntries(rows),
      });
    return { rows, buildLog };
  }, [level, room, status, displayCount]);

  return {
    room,
    status,
    error,
    displayCount,
    level,
    sync,
    diagnostics,
    clearLog: () => remoteLog().clear(),
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
  const recentRtt = useRef(createLatencyStats(10));
  const allRtt = useRef(createLatencyStats(500));
  const countersRef = useRef({ snapshots: 0, reconnects: 0 });

  useEffect(() => {
    const url = buildMirrorWsUrl(room, 'display');
    if (!url) {
      setStatus('error');
      setError('Relais non configuré (VITE_MIRROR_WS_URL).');
      displayLog().add('error', 'relais', 'non configuré');
      return undefined;
    }
    displayLog().add('info', 'salle', `écran Visuel sur ${room}`);

    // Le snapshot a voyagé un aller simple : on le date de son émission estimée (chrono en marche seulement).
    const latency = createLatencyTracker();
    let pingSentAt: number | null = null;
    const sendPing = (socket: WebSocket) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      pingSentAt = Date.now();
      socket.send(JSON.stringify({ type: 'ping' }));
    };

    const applySnapshot = (next: MirrorSnapshot) => {
      const receivedAt = Date.now() - (next.isRunning ? latency.oneWayMs() : 0);
      snapshotRef.current = { snapshot: next, receivedAt };
      countersRef.current.snapshots += 1;
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
        displayLog().add('info', 'ws', 'connecté au relais');
        if (ws) sendPing(ws);
        pingTimer = window.setInterval(() => {
          if (ws) sendPing(ws);
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
            displayLog().add('error', 'relais', `${message.code} ${message.message}`);
            break;
          case 'pong':
            if (pingSentAt !== null) {
              const rtt = Date.now() - pingSentAt;
              latency.addRoundTrip(rtt);
              recentRtt.current.add(rtt);
              allRtt.current.add(rtt);
              pingSentAt = null;
            }
            break;
          case 'push_ok':
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
        if (cancelled) return;
        countersRef.current.reconnects += 1;
        displayLog().add('warn', 'ws', `coupé (code ${event.code}), reconnexion dans ${retryMs} ms`);
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

  // Chrono affiché : réveil seulement quand le chiffre change, et aucun réveil chrono arrêté (batterie).
  useEffect(() => {
    const current = snapshotRef.current;
    if (!current || !current.snapshot.isRunning) return undefined;
    let id: number | null = null;
    const schedule = (remaining: number) => {
      id = window.setTimeout(() => {
        const live = snapshotRef.current;
        if (!live) return;
        const next = remainingFromSnapshot(live.snapshot, Date.now(), live.receivedAt);
        setRemainingTime(next);
        if (live.snapshot.isRunning && next > 0) schedule(next);
      }, nextTickDelay(remaining, current.snapshot.config.affichageMs));
    };
    schedule(remainingFromSnapshot(current.snapshot, Date.now(), current.receivedAt));
    return () => {
      if (id !== null) window.clearTimeout(id);
    };
  }, [snapshot]);

  // État de synchro : réévalué toutes les 2 s (pas besoin de plus pour un voyant).
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 2_000);
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

  const level: SyncLevel = displaySyncLevel({
    status,
    controllerConnected,
    hasSnapshot: snapshot != null,
    isRunning: snapshot?.isRunning ?? false,
    lastSnapshotAt,
    rttMs: recentRtt.current.summary().medianMs,
    now,
  });
  const previousLevel = useRef<SyncLevel | null>(null);
  useEffect(() => {
    if (previousLevel.current === level) return;
    previousLevel.current = level;
    displayLog().add(
      level === 'down' ? 'error' : level === 'slow' ? 'warn' : 'info',
      'synchro',
      `${syncLevelLabel(level)} (aller-retour ${formatMs(recentRtt.current.summary().medianMs)})`,
    );
  }, [level]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = allRtt.current.summary();
      const c = countersRef.current;
      displayLog().add('info', 'stats', `aller-retour médiane=${formatMs(s.medianMs)} p95=${formatMs(s.p95Ms)} max=${formatMs(s.maxMs)} états reçus=${c.snapshots} reconnexions=${c.reconnects}`);
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const diagnostics = useCallback(() => {
    const s = allRtt.current.summary();
    const c = countersRef.current;
    const rows: Array<[string, string]> = [
      ['Synchro', syncLevelLabel(level)],
      ['Salle', room],
      ['Connexion relais', connectionLabel(status)],
      ['Télécommande connectée', controllerConnected ? 'oui' : 'non'],
      ['Dernier état reçu', lastSnapshotAt ? `il y a ${Math.round((Date.now() - lastSnapshotAt) / 1000)} s` : '—'],
      ['Aller-retour médiane', formatMs(s.medianMs)],
      ['Aller-retour p95 / max', `${formatMs(s.p95Ms)} / ${formatMs(s.maxMs)}`],
      ['États reçus', String(c.snapshots)],
      ['Reconnexions', String(c.reconnects)],
    ];
    const buildLog = () =>
      displayLog().toText({
        application: `H8timer ${APP_VERSION}`,
        rôle: 'écran Visuel',
        navigateur: typeof navigator === 'undefined' ? '—' : navigator.userAgent,
        ...Object.fromEntries(rows),
      });
    return { rows, buildLog };
  }, [level, room, status, controllerConnected, lastSnapshotAt]);

  return {
    status,
    error,
    snapshot,
    remainingTime,
    controllerConnected,
    lastSnapshotAt,
    sync,
    level,
    diagnostics,
    clearLog: () => displayLog().clear(),
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
