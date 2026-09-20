#!/usr/bin/env node
/**
 * Relay probe: display + controller over WebSocket against wrangler dev or MIRROR_WS_URL.
 *
 *   npm run test:mirror
 *   MIRROR_WS_URL=wss://h8timer-mirror.h8timer.workers.dev npm run test:mirror
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_PORT = 8787;

const SNAPSHOT = {
  remainingTime: 45_000,
  isRunning: true,
  expectedEnd: 46_000,
  controllerNow: 1_000,
  currentPlayer: 1,
  extensionsUsedInGame: { 1: false, 2: false },
  isExtensionUsedForShot: false,
  shotKind: 'base',
  config: {
    tempsBase: 45,
    tempsApresCasse: 90,
    tempsExtension: 15,
    seuilAlerte: 15,
    seuilCritique: 5,
    affichageMs: true,
    tailleChiffres: 100,
    p1Name: 'P1',
    p1Color: '#3498db',
    p2Name: 'P2',
    p2Color: '#e74c3c',
    theme: 'sombre',
  },
};

function roomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

function toHttpBase(base) {
  if (base.startsWith('wss://')) return `https://${base.slice(6)}`;
  if (base.startsWith('ws://')) return `http://${base.slice(5)}`;
  return base;
}

function wsUrl(base, params) {
  const url = new URL('/ws', toHttpBase(base).replace(/\/$/, ''));
  url.protocol = base.startsWith('wss://') || base.startsWith('https://') ? 'wss:' : 'ws:';
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function openClient(url) {
  const ws = new WebSocket(url);
  const inbox = [];
  const waiters = [];
  ws.addEventListener('message', (event) => {
    let parsed;
    try {
      parsed = JSON.parse(String(event.data));
    } catch {
      return;
    }
    inbox.push(parsed);
    for (let index = waiters.length - 1; index >= 0; index -= 1) {
      const waiter = waiters[index];
      if (waiter.pred(parsed)) {
        waiters.splice(index, 1);
        waiter.resolve(parsed);
      }
    }
  });
  const opened = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`open timeout: ${url}`)), 8_000);
    ws.addEventListener('open', () => {
      clearTimeout(timer);
      resolve();
    });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error(`WebSocket error: ${url}`));
    });
  });
  const closed = new Promise((resolve) => {
    ws.addEventListener('close', (event) => resolve({ code: event.code, reason: String(event.reason ?? '') }));
  });
  function next(pred, timeoutMs = 5_000) {
    const cached = inbox.find(pred);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`timeout waiting for message. inbox=${JSON.stringify(inbox)}`));
      }, timeoutMs);
      waiters.push({
        pred,
        resolve: (message) => {
          clearTimeout(timer);
          resolve(message);
        },
      });
    });
  }
  return { ws, opened, closed, next, inbox };
}

async function probe(baseUrl) {
  const room = roomCode();
  const secret = 'probe-secret-0001';
  const display = openClient(wsUrl(baseUrl, { room, role: 'display' }));
  await display.opened;
  const displayWelcome = await display.next((message) => message.type === 'welcome');
  if (displayWelcome.role !== 'display') throw new Error('display welcome role');

  const controller = openClient(wsUrl(baseUrl, { room, role: 'controller', secret }));
  await controller.opened;
  const controllerWelcome = await controller.next((message) => message.type === 'welcome');
  if (controllerWelcome.displayCount < 1) {
    throw new Error(`controller welcome displayCount=${controllerWelcome.displayCount}`);
  }
  if (!controllerWelcome.controllerConnected) throw new Error('controllerConnected false');

  controller.ws.send(JSON.stringify({ type: 'ping' }));
  const pong = await controller.next((message) => message.type === 'pong');
  if (typeof pong.serverTime !== 'number') throw new Error('pong missing serverTime');

  controller.ws.send(JSON.stringify({ type: 'push', seq: 1, snapshot: SNAPSHOT }));
  const snapshot = await display.next((message) => message.type === 'snapshot');
  if (snapshot.snapshot.remainingTime !== 45_000 || snapshot.snapshot.isRunning !== true) {
    throw new Error(`display snapshot mismatch: ${JSON.stringify(snapshot.snapshot)}`);
  }
  const ack = await controller.next((message) => message.type === 'push_ok');
  if (ack.seq !== 1) throw new Error(`push_ok seq=${ack.seq}`);

  controller.ws.send(JSON.stringify({ type: 'push', seq: 0, snapshot: SNAPSHOT }));
  const stale = await controller.next((message) => message.type === 'error' && message.code === 'stale_seq');
  if (!stale.message) throw new Error('stale_seq missing message');

  controller.ws.send(JSON.stringify({ type: 'push', seq: 2 }));
  const bad = await controller.next((message) => message.type === 'error' && message.code === 'bad_push');
  if (!bad.message) throw new Error('bad_push missing message');

  display.ws.send(JSON.stringify({ type: 'ping' }));
  await display.next((message) => message.type === 'pong');

  const busy = openClient(wsUrl(baseUrl, { room, role: 'controller', secret: 'other-secret' }));
  await busy.opened;
  const busyError = await Promise.race([
    busy.next((message) => message.type === 'error' && message.code === 'room_busy'),
    busy.closed.then((event) => {
      if (event.code === 4009) return { type: 'error', code: 'room_busy', message: event.reason };
      throw new Error(`second controller hung/closed code=${event.code}`);
    }),
  ]);
  if (busyError.code !== 'room_busy') throw new Error(`expected room_busy, got ${JSON.stringify(busyError)}`);

  display.ws.close();
  controller.ws.close();
  busy.ws.close();
  console.log('mirror-probe OK', { baseUrl, room, remainingTime: snapshot.snapshot.remainingTime });
}

async function waitForHealth(baseUrl, child) {
  const healthUrl = `${toHttpBase(baseUrl).replace(/\/$/, '')}/health`;
  const started = Date.now();
  let lastError = 'not started';
  while (Date.now() - started < 45_000) {
    if (child && child.exitCode != null) {
      throw new Error(`wrangler exited ${child.exitCode} before ready`);
    }
    try {
      const response = await fetch(healthUrl);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`wrangler health timeout (${healthUrl}): ${lastError}`);
}

async function startWrangler(port) {
  const child = spawn(
    'npx',
    ['wrangler', 'dev', '--config', 'worker/wrangler.jsonc', '--port', String(port), '--ip', '127.0.0.1'],
    {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
      detached: true,
    },
  );
  let output = '';
  const onData = (chunk) => {
    output += chunk.toString();
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('exit', (code) => {
    if (code && code !== 0) {
      output += `\n[exit ${code}]`;
    }
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHealth(baseUrl, child);
  } catch (error) {
    await stopProcessGroup(child);
    throw new Error(`${error instanceof Error ? error.message : error}\n${output}`);
  }
  return { child, baseUrl: `ws://127.0.0.1:${port}`, output };
}

async function stopProcessGroup(child) {
  if (!child.pid || child.exitCode != null) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
  await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 1_500))]);
  if (child.exitCode != null) return;
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    child.kill('SIGKILL');
  }
}

async function main() {
  const provided = process.env.MIRROR_WS_URL || process.env.MIRROR_PROBE_URL;
  if (provided) {
    await probe(provided.replace(/\/ws\/?$/, ''));
    return;
  }

  const port = Number(process.env.MIRROR_PROBE_PORT || DEFAULT_PORT);
  const { child } = await startWrangler(port);
  try {
    await probe(`ws://127.0.0.1:${port}`);
  } finally {
    await stopProcessGroup(child);
  }
}

main().catch((error) => {
  console.error('mirror-probe FAILED', error);
  process.exit(1);
});
