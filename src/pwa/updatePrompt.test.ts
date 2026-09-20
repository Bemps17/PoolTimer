import { describe, expect, it, vi } from 'vitest';
import {
  applyAppUpdate,
  checkForRemoteUpdate,
  clearOriginCaches,
  fetchRemoteVersion,
  formatUpdateMessage,
  isRemoteNewer,
  isVersionJsonPath,
  parseRemoteVersion,
  parseSemver,
  unregisterServiceWorkers,
} from './updatePrompt';

describe('updatePrompt', () => {
  it('formats the French banner with an optional version', () => {
    expect(formatUpdateMessage()).toBe('Nouvelle version disponible');
    expect(formatUpdateMessage('2.3.1')).toBe('Nouvelle version disponible (v2.3.1)');
  });

  it('reads a remote version payload', () => {
    expect(parseRemoteVersion({ version: '2.3.0' })).toBe('2.3.0');
    expect(parseRemoteVersion({ version: ' 2.3.1 ' })).toBe('2.3.1');
    expect(parseRemoteVersion({ version: '' })).toBeUndefined();
    expect(parseRemoteVersion({})).toBeUndefined();
    expect(parseRemoteVersion(null)).toBeUndefined();
    expect(parseRemoteVersion('2.3.1')).toBeUndefined();
  });

  it('parses numeric semver cores and ignores a leading v', () => {
    expect(parseSemver('2.1.0')).toEqual([2, 1, 0]);
    expect(parseSemver('v2.3.1')).toEqual([2, 3, 1]);
    expect(parseSemver('2.3.1-beta.1')).toEqual([2, 3, 1]);
    expect(parseSemver('not-a-version')).toBeUndefined();
    expect(parseSemver('')).toBeUndefined();
  });

  it('compares remote vs local with semver gt', () => {
    expect(isRemoteNewer('2.3.0', '2.1.0')).toBe(true);
    expect(isRemoteNewer('2.3.1', '2.3.0')).toBe(true);
    expect(isRemoteNewer('3.0.0', '2.9.9')).toBe(true);
    expect(isRemoteNewer('2.3.0', '2.3.0')).toBe(false);
    expect(isRemoteNewer('2.2.0', '2.3.0')).toBe(false);
    expect(isRemoteNewer('2.1.0', '2.3.1')).toBe(false);
    expect(isRemoteNewer('nope', '2.3.1')).toBe(false);
    expect(isRemoteNewer('2.3.1', 'nope')).toBe(false);
  });

  it('matches version.json even with a cache-bust query', () => {
    expect(isVersionJsonPath('/version.json')).toBe(true);
    expect(isVersionJsonPath('/version.json')).toBe(true);
    expect(new URL('https://pooltimer.vercel.app/version.json?t=1').pathname).toBe('/version.json');
    expect(isVersionJsonPath(new URL('https://pooltimer.vercel.app/version.json?t=1').pathname)).toBe(true);
    expect(isVersionJsonPath('/index.html')).toBe(false);
  });

  it('fetches version.json without using the HTTP cache', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ version: '2.3.1' }), { status: 200 }));
    await expect(fetchRemoteVersion(fetcher as unknown as typeof fetch)).resolves.toBe('2.3.1');
    expect(String(fetcher.mock.calls[0]?.[0])).toMatch(/version\.json\?t=\d+/);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ cache: 'no-store' });
  });

  it('reports update / current / unknown from the remote version', async () => {
    const update = vi.fn(async () => new Response(JSON.stringify({ version: '2.3.1' }), { status: 200 }));
    await expect(checkForRemoteUpdate('2.1.0', update as unknown as typeof fetch)).resolves.toEqual({
      status: 'update',
      version: '2.3.1',
    });

    const current = vi.fn(async () => new Response(JSON.stringify({ version: '2.3.1' }), { status: 200 }));
    await expect(checkForRemoteUpdate('2.3.1', current as unknown as typeof fetch)).resolves.toEqual({
      status: 'current',
    });

    const missing = vi.fn(async () => new Response('nope', { status: 404 }));
    await expect(checkForRemoteUpdate('2.3.1', missing as unknown as typeof fetch)).resolves.toEqual({
      status: 'unknown',
    });
  });

  it('unregisters service workers and clears origin caches', async () => {
    const unregister = vi.fn(async () => true);
    await unregisterServiceWorkers({
      getRegistrations: async () => [{ unregister }, { unregister }] as unknown as ServiceWorkerRegistration[],
    });
    expect(unregister).toHaveBeenCalledTimes(2);

    const del = vi.fn(async () => true);
    await clearOriginCaches({
      keys: async () => ['workbox-precache', 'google-fonts-stylesheets'],
      delete: del,
    });
    expect(del).toHaveBeenCalledWith('workbox-precache');
    expect(del).toHaveBeenCalledWith('google-fonts-stylesheets');
  });

  it('applies an update via waiting SW then hard recovery and reload', async () => {
    const updateServiceWorker = vi.fn(async () => undefined);
    const unregister = vi.fn(async () => true);
    const deleteCache = vi.fn(async () => true);
    const reload = vi.fn();

    await applyAppUpdate({
      updateServiceWorker,
      serviceWorker: {
        getRegistrations: async () => [{ unregister }] as unknown as ServiceWorkerRegistration[],
      },
      caches: { keys: async () => ['workbox-precache'], delete: deleteCache },
      reload,
      waitMs: 10,
    });

    expect(updateServiceWorker).toHaveBeenCalledWith(true);
    expect(unregister).toHaveBeenCalledTimes(1);
    expect(deleteCache).toHaveBeenCalledWith('workbox-precache');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('still reloads if updateServiceWorker fails', async () => {
    const reload = vi.fn();
    await applyAppUpdate({
      updateServiceWorker: async () => {
        throw new Error('no waiting worker');
      },
      reload,
      waitMs: 10,
    });
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
