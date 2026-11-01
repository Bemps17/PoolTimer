/**
 * Quand le relais doit-il écrire dans le stockage du Durable Object ?
 * Plan gratuit Cloudflare : 100 000 lignes écrites par jour pour TOUT le compte (chaque put / setAlarm = 1 ligne).
 * Avant v3.0.1 : 3 lignes par snapshot, un snapshot toutes les 2 s => ~5 400 lignes/heure/salle.
 *
 * Règles :
 * - le snapshot en mémoire est toujours à jour (c'est lui qui est diffusé) ;
 * - on le persiste au premier push, à chaque push chrono arrêté (pause, réglage), et au plus toutes les 30 s
 *   chrono en marche (un écran qui se reconnecte reçoit alors un état récent, corrigé par le push suivant) ;
 * - l'alarme d'expiration (~2 h) n'est repoussée que toutes les 10 min.
 */

export const SNAPSHOT_PERSIST_MS = 30_000;
export const ALARM_REFRESH_MS = 10 * 60_000;

export interface WriteStep {
  persist: boolean;
  refreshAlarm: boolean;
}

export interface WritePlanner {
  onPush(input: { isRunning: boolean; now: number }): WriteStep;
}

export function createWritePlanner(): WritePlanner {
  let lastPersistAt: number | null = null;
  let lastAlarmAt: number | null = null;
  return {
    onPush({ isRunning, now }) {
      const persist = lastPersistAt === null || !isRunning || now - lastPersistAt >= SNAPSHOT_PERSIST_MS;
      if (persist) lastPersistAt = now;
      const refreshAlarm = lastAlarmAt === null || now - lastAlarmAt >= ALARM_REFRESH_MS;
      if (refreshAlarm) lastAlarmAt = now;
      return { persist, refreshAlarm };
    },
  };
}
