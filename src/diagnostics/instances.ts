import { createDiagnosticsLog, type DiagnosticsLog } from './log';

let remote: DiagnosticsLog | null = null;
let display: DiagnosticsLog | null = null;

/** Journal de la télécommande (créé à la première utilisation). */
export function remoteLog(): DiagnosticsLog {
  remote ??= createDiagnosticsLog({ key: 'h8timer.log.remote' });
  return remote;
}

/** Journal de l'écran Visuel. */
export function displayLog(): DiagnosticsLog {
  display ??= createDiagnosticsLog({ key: 'h8timer.log.display' });
  return display;
}

export function formatMs(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)} ms`;
}

/** Libellé français d'un état de connexion au relais. */
export function connectionLabel(status: string): string {
  switch (status) {
    case 'live':
      return 'connecté';
    case 'connecting':
      return 'connexion…';
    case 'error':
      return 'erreur';
    case 'idle':
      return 'inactif';
    default:
      return status;
  }
}
