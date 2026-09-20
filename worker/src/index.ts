import { DurableObject } from 'cloudflare:workers';
import { EphemeralRoom } from '../../src/mirror/room';
import {
  isValidRoomCode,
  normalizeRoomCode,
  parseClientMessage,
  type MirrorRole,
} from '../../src/mirror/protocol';

export interface Env {
  ROOMS: DurableObjectNamespace<TimerRoom>;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

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

    if (role === 'controller') {
      if (this.room.claimController(secret) === 'busy') {
        return Response.json(
          { type: 'error', code: 'room_busy', message: 'Cette salle a déjà une télécommande.' },
          { status: 409, headers: CORS },
        );
      }
      await this.ctx.storage.put('secret', secret);
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server, [role]);
    server.serializeAttachment({ role, secret });

    const welcome = JSON.stringify({
      type: 'welcome',
      room,
      role,
      displayCount: this.ctx.getWebSockets('display').length,
      controllerConnected: this.ctx.getWebSockets('controller').length > 0,
      serverTime: Date.now(),
      snapshot: this.room.snapshot,
      seq: this.room.seq,
    });
    server.send(welcome);
    this.broadcastPeers();
    await this.touchAlarm();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    await this.restore();
    const attachment = (ws.deserializeAttachment() ?? {}) as { role?: MirrorRole; secret?: string };
    let parsed: unknown;
    try {
      parsed = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    } catch {
      return;
    }
    const clientMessage = parseClientMessage(parsed);
    if (!clientMessage) return;

    switch (clientMessage.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', serverTime: Date.now() }));
        return;
      case 'push': {
        if (attachment.role !== 'controller') return;
        if (!this.room.acceptSnapshot(clientMessage.seq, clientMessage.snapshot)) return;
        await this.ctx.storage.put('snapshot', clientMessage.snapshot);
        await this.ctx.storage.put('seq', clientMessage.seq);
        const payload = JSON.stringify({
          type: 'snapshot',
          seq: clientMessage.seq,
          snapshot: clientMessage.snapshot,
          serverTime: Date.now(),
        });
        for (const peer of this.ctx.getWebSockets('display')) {
          peer.send(payload);
        }
        await this.touchAlarm();
        return;
      }
      default: {
        const exhaustive: never = clientMessage;
        return exhaustive;
      }
    }
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

  private broadcastPeers(): void {
    const payload = JSON.stringify({
      type: 'peers',
      displayCount: this.ctx.getWebSockets('display').length,
      controllerConnected: this.ctx.getWebSockets('controller').length > 0,
    });
    for (const peer of this.ctx.getWebSockets()) {
      try {
        peer.send(payload);
      } catch {
        // ignore closed sockets
      }
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
