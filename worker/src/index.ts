import { DurableObject } from 'cloudflare:workers';
import { EphemeralRoom } from '../../src/mirror/room';
import {
  isValidRoomCode,
  normalizeRoomCode,
  parseClientMessage,
  WS_CLOSE_ROOM_BUSY,
  type MirrorErrorCode,
  type MirrorRole,
} from '../../src/mirror/protocol';
import {
  countSocketsByRole,
  parseSocketAttachment,
  resolveSocketRole,
  selectDisplayTargets,
  type SocketAttachment,
} from '../../src/mirror/relay';

export interface Env {
  ROOMS: DurableObjectNamespace<TimerRoom>;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
const ROOM_BUSY_MESSAGE = 'Cette salle a déjà une télécommande.';

export class TimerRoom extends DurableObject<Env> {
  private room = new EphemeralRoom();
  private loaded = false;

  private async restore(): Promise<void> {
    if (this.loaded) return;
    const secret = await this.ctx.storage.get<string>('secret');
    const seq = await this.ctx.storage.get<number>('seq');
    const snapshot = await this.ctx.storage.get<EphemeralRoom['snapshot']>('snapshot');
    if (typeof secret === 'string') this.room.controllerSecret = secret;
    if (typeof seq === 'number') this.room.seq = seq;
    if (snapshot) this.room.snapshot = snapshot;
    this.loaded = true;
  }

  async fetch(request: Request): Promise<Response> {
    await this.restore();
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426, headers: CORS });
    }

    const url = new URL(request.url);
    const room = normalizeRoomCode(url.searchParams.get('room') ?? '');
    const role = url.searchParams.get('role');
    const secret = url.searchParams.get('secret') ?? '';
    if (!isValidRoomCode(room) || (role !== 'controller' && role !== 'display')) {
      return new Response('Invalid room or role', { status: 400, headers: CORS });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    if (role === 'controller' && this.room.claimController(secret) === 'busy') {
      this.ctx.acceptWebSocket(server, ['busy']);
      this.sendJson(server, { type: 'error', code: 'room_busy', message: ROOM_BUSY_MESSAGE });
      try {
        server.close(WS_CLOSE_ROOM_BUSY, 'room_busy');
      } catch {
        // ignore
      }
      return new Response(null, { status: 101, webSocket: client });
    }

    if (role === 'controller') {
      await this.ctx.storage.put('secret', secret);
      await this.ctx.storage.put('seq', this.room.seq);
    }

    this.ctx.acceptWebSocket(server, [role]);
    server.serializeAttachment({ role, secret } satisfies SocketAttachment);

    const sockets = this.ctx.getWebSockets();
    const welcome = JSON.stringify({
      type: 'welcome',
      room,
      role,
      displayCount: this.countRole('display', sockets),
      controllerConnected: this.countRole('controller', sockets) > 0,
      serverTime: Date.now(),
      snapshot: this.room.snapshot,
      seq: this.room.seq,
    });
    this.sendRaw(server, welcome);
    this.broadcastPeers();
    await this.touchAlarm();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    await this.restore();
    this.ensureAttachment(ws);

    let parsed: unknown;
    try {
      parsed = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    } catch {
      this.sendError(ws, 'bad_push', 'Message JSON invalide.');
      return;
    }

    const type = parsed && typeof parsed === 'object' ? (parsed as { type?: unknown }).type : undefined;
    if (type === 'ping') {
      this.sendJson(ws, { type: 'pong', serverTime: Date.now() });
      return;
    }

    if (type !== 'push') return;

    if (this.socketRole(ws) !== 'controller') {
      this.sendError(ws, 'unauthorized', 'Seul la télécommande peut publier le chrono.');
      return;
    }

    const clientMessage = parseClientMessage(parsed);
    if (!clientMessage || clientMessage.type !== 'push') {
      this.sendError(ws, 'bad_push', 'Snapshot invalide.');
      return;
    }

    if (!this.room.acceptSnapshot(clientMessage.seq, clientMessage.snapshot)) {
      this.sendError(
        ws,
        'stale_seq',
        `Séquence obsolète (${clientMessage.seq} < ${this.room.seq}).`,
      );
      return;
    }

    await this.ctx.storage.put('snapshot', clientMessage.snapshot);
    await this.ctx.storage.put('seq', clientMessage.seq);

    const payload = JSON.stringify({
      type: 'snapshot',
      seq: clientMessage.seq,
      snapshot: clientMessage.snapshot,
      serverTime: Date.now(),
    });
    for (const peer of this.displayTargets(ws)) {
      this.sendRaw(peer, payload);
    }
    this.sendJson(ws, { type: 'push_ok', seq: clientMessage.seq });
    await this.touchAlarm();
  }

  async webSocketClose(): Promise<void> {
    this.broadcastPeers();
  }

  async alarm(): Promise<void> {
    const live = this.ctx.getWebSockets();
    if (live.length > 0) {
      await this.touchAlarm();
      return;
    }
    await this.ctx.storage.deleteAll();
    this.room = new EphemeralRoom();
    this.loaded = true;
  }

  private socketRole(ws: WebSocket): MirrorRole | undefined {
    return resolveSocketRole(this.readAttachment(ws), this.tagsOf(ws));
  }

  private readAttachment(ws: WebSocket): SocketAttachment {
    try {
      return parseSocketAttachment(ws.deserializeAttachment());
    } catch {
      return {};
    }
  }

  private tagsOf(ws: WebSocket): string[] {
    const getTags = (this.ctx as { getTags?: (socket: WebSocket) => string[] }).getTags;
    if (typeof getTags !== 'function') return [];
    try {
      const tags = getTags.call(this.ctx, ws);
      return Array.isArray(tags) ? tags : [];
    } catch {
      return [];
    }
  }

  private ensureAttachment(ws: WebSocket): void {
    const current = this.readAttachment(ws);
    if (current.role) return;
    const role = resolveSocketRole(current, this.tagsOf(ws));
    if (!role) return;
    try {
      ws.serializeAttachment({ role, secret: current.secret ?? '' });
    } catch {
      // ignore
    }
  }

  private countRole(role: MirrorRole, sockets = this.ctx.getWebSockets()): number {
    const tagged = this.ctx.getWebSockets(role);
    if (tagged.length > 0) return tagged.length;
    return countSocketsByRole(sockets, (socket) => this.socketRole(socket), role);
  }

  private displayTargets(sender: WebSocket): WebSocket[] {
    return selectDisplayTargets({
      sender,
      taggedDisplays: this.ctx.getWebSockets('display'),
      allSockets: this.ctx.getWebSockets(),
      roleOf: (socket) => this.socketRole(socket),
    });
  }

  private broadcastPeers(): void {
    const sockets = this.ctx.getWebSockets();
    const payload = JSON.stringify({
      type: 'peers',
      displayCount: this.countRole('display', sockets),
      controllerConnected: this.countRole('controller', sockets) > 0,
    });
    for (const peer of sockets) {
      this.sendRaw(peer, payload);
    }
  }

  private sendError(ws: WebSocket, code: MirrorErrorCode, message: string): void {
    this.sendJson(ws, { type: 'error', code, message });
  }

  private sendJson(ws: WebSocket, payload: unknown): void {
    this.sendRaw(ws, JSON.stringify(payload));
  }

  private sendRaw(ws: WebSocket, payload: string): void {
    try {
      ws.send(payload);
    } catch {
      // ignore closed sockets
    }
  }

  private async touchAlarm(): Promise<void> {
    await this.ctx.storage.setAlarm(Date.now() + ROOM_TTL_MS);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return Response.json({ ok: true, service: 'h8timer-mirror' }, { headers: CORS });
    }

    if (url.pathname === '/ws') {
      const room = normalizeRoomCode(url.searchParams.get('room') ?? '');
      if (!isValidRoomCode(room)) {
        return Response.json(
          { type: 'error', code: 'invalid_room', message: 'Code salle invalide.' },
          { status: 400, headers: CORS },
        );
      }
      const id = env.ROOMS.idFromName(room);
      return env.ROOMS.get(id).fetch(request);
    }

    return new Response('H8timer mirror', { status: 200, headers: CORS });
  },
};
