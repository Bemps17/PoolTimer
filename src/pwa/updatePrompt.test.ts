import { describe, expect, it, vi } from 'vitest';
import { formatUpdateMessage, parseRemoteVersion, fetchRemoteVersion } from './updatePrompt';

describe('updatePrompt', () => {
  it('formats the French banner with an optional version', () => {
    expect(formatUpdateMessage()).toBe('Nouvelle version disponible');
    expect(formatUpdateMessage('2.2.0')).toBe('Nouvelle version disponible (v2.2.0)');
  });

  it('reads a remote version payload', () => {
    expect(parseRemoteVersion({ version: '2.2.0' })).toBe('2.2.0');
    expect(parseRemoteVersion({})).toBeUndefined();
  });

  it('fetches version.json without using the HTTP cache', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ version: '2.2.0' }), { status: 200 }));
    await expect(fetchRemoteVersion(fetcher as unknown as typeof fetch)).resolves.toBe('2.2.0');
    expect(String(fetcher.mock.calls[0]?.[0])).toMatch(/version\.json/);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ cache: 'no-store' });
  });
});
