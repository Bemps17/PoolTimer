export function parseRemoteVersion(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const version = (payload as { version?: unknown }).version;
  if (typeof version !== 'string') return undefined;
  const trimmed = version.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function formatUpdateMessage(incomingVersion?: string): string {
  if (incomingVersion) {
    return `Nouvelle version disponible (v${incomingVersion})`;
  }
  return 'Nouvelle version disponible';
}

export async function fetchRemoteVersion(fetcher: typeof fetch = fetch): Promise<string | undefined> {
  try {
    const response = await fetcher(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return undefined;
    return parseRemoteVersion(await response.json());
  } catch {
    return undefined;
  }
}
