export function getMirrorWsBase(): string | undefined {
  const raw = import.meta.env.VITE_MIRROR_WS_URL;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed.replace(/\/$/, '') : undefined;
}

export function isMirrorRelayConfigured(): boolean {
  return Boolean(getMirrorWsBase());
}

export function getMirrorRelayHost(base = getMirrorWsBase()): string | null {
  if (!base) return null;
  try {
    return new URL(base).host || null;
  } catch {
    return null;
  }
}

export function buildMirrorWsUrl(
  room: string,
  role: 'controller' | 'display',
  secret?: string,
  base = getMirrorWsBase(),
): string | undefined {
  if (!base) return undefined;
  const withPath = /\/ws$/i.test(base) ? base : `${base}/ws`;
  const url = new URL(withPath);
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol === 'https:') url.protocol = 'wss:';
  url.searchParams.set('room', room);
  url.searchParams.set('role', role);
  if (secret) url.searchParams.set('secret', secret);
  return url.toString();
}
