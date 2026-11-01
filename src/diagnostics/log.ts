/**
 * Journal de diagnostic (télécommande et écran Visuel) : événements de connexion, de synchro et d'erreur.
 * Borné, persisté localement, exportable en fichier .log. Ne contient jamais le secret de salle.
 */
export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  t: number;
  level: LogLevel;
  event: string;
  detail?: string;
}

type Storage3 = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const LEVELS: LogLevel[] = ['info', 'warn', 'error'];

/** Masque les secrets de salle (32 hex) et le paramètre `secret=` d'une URL. */
export function redact(text: string): string {
  return text.replace(/secret=[^&\s]*/gi, 'secret=[masqué]').replace(/\b[a-f0-9]{32}\b/gi, '[masqué]');
}

function defaultStorage(): Storage3 | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

function parseEntries(raw: string | null, max: number): LogEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: LogEntry[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const value = item as Partial<Record<keyof LogEntry, unknown>>;
      if (typeof value.t !== 'number' || !Number.isFinite(value.t)) continue;
      if (!LEVELS.includes(value.level as LogLevel) || typeof value.event !== 'string') continue;
      out.push({
        t: value.t,
        level: value.level as LogLevel,
        event: value.event.slice(0, 40),
        ...(typeof value.detail === 'string' ? { detail: redact(value.detail).slice(0, 300) } : {}),
      });
    }
    return out.slice(-max);
  } catch {
    return [];
  }
}

export function createDiagnosticsLog(options: {
  key: string;
  max?: number;
  storage?: Storage3;
  now?: () => number;
}) {
  const max = options.max ?? 500;
  const storage = options.storage ?? defaultStorage();
  const now = options.now ?? Date.now;
  let entries = parseEntries(storage?.getItem(options.key) ?? null, max);

  const persist = () => {
    try {
      storage?.setItem(options.key, JSON.stringify(entries));
    } catch {
      // quota : le journal reste en mémoire
    }
  };

  return {
    add(level: LogLevel, event: string, detail?: string): void {
      entries = [...entries, { t: now(), level, event, ...(detail ? { detail: redact(detail).slice(0, 300) } : {}) }].slice(-max);
      persist();
    },
    entries(): LogEntry[] {
      return [...entries];
    },
    clear(): void {
      entries = [];
      try {
        storage?.removeItem(options.key);
      } catch {
        // ignore
      }
    },
    /** Fichier texte : en-tête (clé: valeur) puis une ligne par événement. */
    toText(meta: Record<string, string>): string {
      const header = Object.entries(meta).map(([key, value]) => `${key}: ${redact(value)}`);
      const lines = entries.map(
        (entry) =>
          `${new Date(entry.t).toISOString()} ${entry.level.toUpperCase()} ${entry.event}${entry.detail ? ` ${entry.detail}` : ''}`,
      );
      return [...header, `généré: ${new Date(now()).toISOString()}`, '', ...lines, ''].join('\n');
    },
  };
}

export type DiagnosticsLog = ReturnType<typeof createDiagnosticsLog>;

/** Statistiques des derniers allers-retours (ms). */
export function createLatencyStats(size = 200) {
  const samples: number[] = [];
  return {
    add(ms: number): void {
      if (!Number.isFinite(ms) || ms < 0) return;
      samples.push(ms);
      if (samples.length > size) samples.shift();
    },
    summary(): { count: number; medianMs: number | null; p95Ms: number | null; maxMs: number | null } {
      if (samples.length === 0) return { count: 0, medianMs: null, p95Ms: null, maxMs: null };
      const sorted = [...samples].sort((a, b) => a - b);
      const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)]!;
      return { count: sorted.length, medianMs: at(0.5), p95Ms: at(0.95), maxMs: sorted.at(-1)! };
    },
  };
}
