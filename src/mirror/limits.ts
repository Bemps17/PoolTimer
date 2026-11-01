/**
 * Garde-fous du relais miroir (Worker Cloudflare). Fonctions pures, testées, partagées avec le Worker.
 * Objectif : un relais gratuit qui ne se laisse ni saturer ni détourner par des pages tierces.
 */

/** Un snapshot pèse ~2-3 Ko (23 couleurs comprises) : 32 Ko laissent une large marge. */
export const MAX_MESSAGE_BYTES = 32 * 1024;
export const MAX_DISPLAYS_PER_ROOM = 40;
/** Rafale tolérée de la télécommande (appuis rapides) puis débit soutenu. */
export const PUSH_RATE = { capacity: 30, refillPerSec: 15 } as const;
export const PING_RATE = { capacity: 10, refillPerSec: 1 } as const;

const PRODUCTION_ORIGIN = 'https://pooltimer.vercel.app';
const VERCEL_PREVIEW = /^https:\/\/pooltimer(?:-git-[a-z0-9-]+|-[a-z0-9]+)-bemps17s-projects\.vercel\.app$/;
const LOCAL = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/;

/**
 * Origine de la page qui ouvre le WebSocket. Les clients hors navigateur n'envoient pas d'Origin : acceptés
 * (le secret de salle protège la télécommande). `extra` = liste séparée par des virgules (variable du Worker).
 */
export function isAllowedOrigin(origin: string | null | undefined, extra = ''): boolean {
  if (origin === null || origin === undefined || origin === '') return true;
  if (origin === PRODUCTION_ORIGIN || VERCEL_PREVIEW.test(origin) || LOCAL.test(origin)) return true;
  return extra
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .includes(origin);
}

export function isMessageTooLarge(message: string | ArrayBuffer): boolean {
  const size = typeof message === 'string' ? new TextEncoder().encode(message).byteLength : message.byteLength;
  return size > MAX_MESSAGE_BYTES;
}

export function canAcceptDisplay(currentDisplays: number): boolean {
  return currentDisplays < MAX_DISPLAYS_PER_ROOM;
}

export interface RateLimiter {
  take(now: number): boolean;
}

/** Seau à jetons. Une horloge qui recule n'ajoute pas de jetons. */
export function createRateLimiter(options: { capacity: number; refillPerSec: number }): RateLimiter {
  let tokens = options.capacity;
  let last: number | null = null;
  return {
    take(now: number): boolean {
      if (last !== null && now > last) {
        tokens = Math.min(options.capacity, tokens + ((now - last) / 1000) * options.refillPerSec);
      }
      if (last === null || now > last) last = now;
      if (tokens >= 1) {
        tokens -= 1;
        return true;
      }
      return false;
    },
  };
}

/**
 * Nouvelles connexions WebSocket par adresse IP (binding « Rate Limiting » des Workers : en mémoire, sans écriture).
 * Une soirée de club (télécommande + écrans + reconnexions) reste très en dessous ; un script qui boucle est coupé
 * avant d'atteindre le Durable Object, donc sans consommer de requête ni d'écriture du quota gratuit.
 */
export const CONNECT_RATE = { limit: 40, period: 60 } as const;

export function connectionKey(headers: Pick<Headers, 'get'>): string {
  const ip = headers.get('CF-Connecting-IP')?.trim();
  return `ip:${ip || 'unknown'}`;
}
