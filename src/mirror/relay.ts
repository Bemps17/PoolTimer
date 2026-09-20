import type { MirrorRole } from './protocol';

export interface SocketAttachment {
  role?: MirrorRole;
  secret?: string;
}

export function parseSocketAttachment(raw: unknown): SocketAttachment {
  if (!raw || typeof raw !== 'object') return {};
  const value = raw as { role?: unknown; secret?: unknown };
  const role = value.role === 'controller' || value.role === 'display' ? value.role : undefined;
  const secret = typeof value.secret === 'string' ? value.secret : undefined;
  return { role, secret };
}

export function roleFromTags(tags: readonly string[]): MirrorRole | undefined {
  if (tags.includes('controller')) return 'controller';
  if (tags.includes('display')) return 'display';
  return undefined;
}

export function resolveSocketRole(attachment: unknown, tags: readonly string[]): MirrorRole | undefined {
  const parsed = parseSocketAttachment(attachment);
  return parsed.role ?? roleFromTags(tags);
}

export function isStaleSeq(seq: number, current: number): boolean {
  return seq < current;
}

/**
 * Prefer hibernation tags. If that list is empty (known Durable Object gap after
 * wake), fan out to every non-controller socket except the sender.
 */
export function selectDisplayTargets<T>(input: {
  sender: T;
  taggedDisplays: readonly T[];
  allSockets: readonly T[];
  roleOf: (socket: T) => MirrorRole | undefined;
}): T[] {
  const tagged = input.taggedDisplays.filter((socket) => socket !== input.sender);
  if (tagged.length > 0) return tagged;
  return input.allSockets.filter((socket) => socket !== input.sender && input.roleOf(socket) !== 'controller');
}

export function countSocketsByRole<T>(
  sockets: readonly T[],
  roleOf: (socket: T) => MirrorRole | undefined,
  role: MirrorRole,
): number {
  return sockets.filter((socket) => roleOf(socket) === role).length;
}
