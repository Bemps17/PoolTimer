import { describe, expect, it } from 'vitest';
import { createDiagnosticsLog, createLatencyStats, redact } from './log';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe('journal de diagnostic', () => {
  it('keeps the most recent entries only (bounded memory and storage)', () => {
    const log = createDiagnosticsLog({ key: 'k', max: 3, storage: memoryStorage(), now: () => 0 });
    for (let i = 0; i < 5; i += 1) log.add('info', `e${i}`);
    expect(log.entries().map((e) => e.event)).toEqual(['e2', 'e3', 'e4']);
  });

  it('never stores the room secret', () => {
    expect(redact('wss://relay/ws?room=AB3K7Q&role=controller&secret=0123456789abcdef0123456789abcdef')).not.toMatch(
      /0123456789abcdef/,
    );
    expect(redact('secret 0123456789abcdef0123456789abcdef seen')).toBe('secret [masqué] seen');
    expect(redact('room AB3K7Q rtt=40ms')).toBe('room AB3K7Q rtt=40ms');
  });

  it('survives a reload and ignores corrupted storage', () => {
    const storage = memoryStorage();
    const first = createDiagnosticsLog({ key: 'k', storage, now: () => 1_000 });
    first.add('warn', 'sync', 'slow rtt=420ms');
    const second = createDiagnosticsLog({ key: 'k', storage, now: () => 2_000 });
    expect(second.entries()).toEqual([{ t: 1_000, level: 'warn', event: 'sync', detail: 'slow rtt=420ms' }]);
    storage.setItem('k', '{broken');
    expect(createDiagnosticsLog({ key: 'k', storage }).entries()).toEqual([]);
    storage.setItem('k', JSON.stringify([{ t: 'x' }, { t: 5, level: 'evil', event: 'a' }, { t: 6, level: 'info', event: 'ok' }]));
    expect(createDiagnosticsLog({ key: 'k', storage }).entries()).toEqual([{ t: 6, level: 'info', event: 'ok' }]);
  });

  it('exports a readable .log text with a header', () => {
    const log = createDiagnosticsLog({ key: 'k', storage: memoryStorage(), now: () => Date.UTC(2026, 10, 1, 1, 2, 3) });
    log.add('error', 'ws', 'closed code=1006');
    const text = log.toText({ application: 'H8timer 3.2.0', rôle: 'télécommande' });
    expect(text).toContain('application: H8timer 3.2.0');
    expect(text).toContain('rôle: télécommande');
    expect(text).toContain('2026-11-01T01:02:03.000Z ERROR ws closed code=1006');
  });

  it('can be cleared', () => {
    const storage = memoryStorage();
    const log = createDiagnosticsLog({ key: 'k', storage });
    log.add('info', 'x');
    log.clear();
    expect(log.entries()).toEqual([]);
    expect(createDiagnosticsLog({ key: 'k', storage }).entries()).toEqual([]);
  });
});

describe('statistiques de latence', () => {
  it('reports median, p95 and max of recent round trips', () => {
    const stats = createLatencyStats(100);
    for (let i = 1; i <= 100; i += 1) stats.add(i);
    expect(stats.summary()).toEqual({ count: 100, medianMs: 50, p95Ms: 95, maxMs: 100 });
  });

  it('is empty-safe and ignores invalid samples', () => {
    const stats = createLatencyStats();
    stats.add(Number.NaN);
    stats.add(-1);
    expect(stats.summary()).toEqual({ count: 0, medianMs: null, p95Ms: null, maxMs: null });
  });
});

describe('libellés de connexion (diagnostic en français)', () => {
  it('translates relay states', async () => {
    const { connectionLabel } = await import('./instances');
    expect(connectionLabel('live')).toBe('connecté');
    expect(connectionLabel('connecting')).toBe('connexion…');
    expect(connectionLabel('error')).toBe('erreur');
  });
});
