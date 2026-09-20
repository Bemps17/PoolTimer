export function parseRemoteVersion(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const version = (payload as { version?: unknown }).version;
  if (typeof version !== 'string') return undefined;
  const trimmed = version.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Numeric semver core (major.minor.patch), ignoring a leading `v` and any prerelease/build suffix. */
export function parseSemver(version: string): [number, number, number] | undefined {
  const trimmed = version.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/^v?(\d+)\.(\d+)\.(\d+)\b/i);
  if (!match) return undefined;
  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2], 10);
  const patch = Number.parseInt(match[3], 10);
  if (![major, minor, patch].every((part) => Number.isFinite(part))) return undefined;
  return [major, minor, patch];
}

export function isRemoteNewer(remote: string, local: string): boolean {
  const remoteParts = parseSemver(remote);
  const localParts = parseSemver(local);
  if (!remoteParts || !localParts) return false;
  for (let index = 0; index < 3; index += 1) {
    if (remoteParts[index] !== localParts[index]) {
      return remoteParts[index] > localParts[index];
    }
  }
  return false;
}

export function formatUpdateMessage(incomingVersion?: string): string {
  if (incomingVersion) {
    return `Nouvelle version disponible (v${incomingVersion})`;
  }
  return 'Nouvelle version disponible';
}

export function isVersionJsonPath(pathname: string): boolean {
  return pathname === '/version.json' || pathname.endsWith('/version.json');
}

export async function fetchRemoteVersion(fetcher: typeof fetch = fetch): Promise<string | undefined> {
  try {
    const response = await fetcher(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
    });
    if (!response.ok) return undefined;
    return parseRemoteVersion(await response.json());
  } catch {
    return undefined;
  }
}

export type UpdateCheckResult =
  | { status: 'update'; version: string }
  | { status: 'current' }
  | { status: 'unknown' };

export async function checkForRemoteUpdate(
  localVersion: string,
  fetcher: typeof fetch = fetch,
): Promise<UpdateCheckResult> {
  const remote = await fetchRemoteVersion(fetcher);
  if (!remote) return { status: 'unknown' };
  if (isRemoteNewer(remote, localVersion)) return { status: 'update', version: remote };
  return { status: 'current' };
}

export interface ApplyUpdateDeps {
  updateServiceWorker?: (reloadPage?: boolean) => Promise<void> | void;
  serviceWorker?: Pick<ServiceWorkerContainer, 'getRegistrations'>;
  caches?: Pick<CacheStorage, 'keys' | 'delete'>;
  reload?: () => void;
  waitMs?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function unregisterServiceWorkers(
  serviceWorker: Pick<ServiceWorkerContainer, 'getRegistrations'>,
): Promise<void> {
  const registrations = await serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

export async function clearOriginCaches(cacheStorage: Pick<CacheStorage, 'keys' | 'delete'>): Promise<void> {
  const keys = await cacheStorage.keys();
  await Promise.all(keys.map((key) => cacheStorage.delete(key)));
}

/**
 * Prefer activating a waiting SW, then always drop this origin's SW + Cache Storage
 * and reload so a stuck PWA cannot keep serving an old precache.
 */
export async function applyAppUpdate(deps: ApplyUpdateDeps = {}): Promise<void> {
  const reload =
    deps.reload ??
    (() => {
      window.location.reload();
    });

  if (deps.updateServiceWorker) {
    try {
      await Promise.race([Promise.resolve(deps.updateServiceWorker(true)), delay(deps.waitMs ?? 1200)]);
    } catch {
      // Fall through to unregister / cache-clear / reload.
    }
  }

  const serviceWorker =
    deps.serviceWorker ?? (typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined);
  if (serviceWorker) {
    try {
      await unregisterServiceWorkers(serviceWorker);
    } catch {
      // Continue: reload still helps if caches can be cleared.
    }
  }

  const cacheStorage = deps.caches ?? (typeof caches !== 'undefined' ? caches : undefined);
  if (cacheStorage) {
    try {
      await clearOriginCaches(cacheStorage);
    } catch {
      // Continue: SW unregister + reload is still better than staying stuck.
    }
  }

  reload();
}
