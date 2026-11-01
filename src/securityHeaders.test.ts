import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** S2 (audit de sécurité) : en-têtes HTTP posés par Vercel sur toutes les pages. */
interface VercelConfig {
  headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
}

const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as VercelConfig;
const allPages = vercel.headers?.find((entry) => entry.source === '/(.*)');
const header = (name: string) => allPages?.headers.find((entry) => entry.key.toLowerCase() === name.toLowerCase())?.value;
const csp = () =>
  Object.fromEntries(
    (header('Content-Security-Policy') ?? '')
      .split(';')
      .map((part) => part.trim().split(/\s+/))
      .filter((parts) => parts[0])
      .map(([directive, ...values]) => [directive, values]),
  ) as Record<string, string[]>;

describe('en-têtes de sécurité (vercel.json)', () => {
  it('applies to every path', () => {
    expect(allPages).toBeDefined();
  });

  it('forbids framing the app (clickjacking) — OBS uses a browser source, not an iframe', () => {
    expect(header('X-Frame-Options')).toBe('DENY');
    expect(csp()['frame-ancestors']).toEqual(["'none'"]);
  });

  it('sends no referrer, no MIME sniffing, and turns off unused powerful features', () => {
    expect(header('Referrer-Policy')).toBe('no-referrer');
    expect(header('X-Content-Type-Options')).toBe('nosniff');
    const permissions = header('Permissions-Policy') ?? '';
    for (const feature of ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()']) {
      expect(permissions).toContain(feature);
    }
    // l'écran allumé et le plein écran restent permis à l'app
    expect(permissions).not.toMatch(/screen-wake-lock=\(\)|fullscreen=\(\)/);
  });

  it('CSP: only our own scripts, no plugins, no injected base or forms', () => {
    const policy = csp();
    expect(policy['default-src']).toEqual(["'self'"]);
    expect(policy['script-src']).toContain("'self'");
    expect(policy['script-src']).not.toContain("'unsafe-inline'");
    expect(policy['script-src']).not.toContain("'unsafe-eval'");
    expect(policy['object-src']).toEqual(["'none'"]);
    expect(policy['base-uri']).toEqual(["'self'"]);
    expect(policy['form-action']).toEqual(["'self'"]);
  });

  it('CSP: the app keeps working — relay WebSocket, Tone.js audio worklet (blob:), imported sounds, QR, fonts', () => {
    const policy = csp();
    expect(policy['connect-src']).toContain('wss://h8timer-mirror.h8timer.workers.dev');
    expect(policy['script-src']).toContain('blob:');
    expect(policy['media-src']).toEqual(expect.arrayContaining(["'self'", 'blob:']));
    expect(policy['img-src']).toEqual(expect.arrayContaining(["'self'", 'data:', 'blob:']));
    expect(policy['font-src']).toContain('https://fonts.gstatic.com');
    expect(policy['style-src']).toContain('https://fonts.googleapis.com');
  });

  it('keeps the existing rules (SPA rewrites, version.json never cached)', () => {
    const raw = vercel as VercelConfig & { rewrites?: unknown[] };
    expect(raw.rewrites?.length).toBeGreaterThan(0);
    expect(vercel.headers?.find((entry) => entry.source === '/version.json')).toBeDefined();
  });
});
