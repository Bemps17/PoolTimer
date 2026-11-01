/**
 * Garder l'écran allumé (télécommande ET écran Visuel).
 * 1) Screen Wake Lock API (Chrome / Edge / Safari récents) ; 2) repli « vidéo muette en boucle » (technique NoSleep)
 * pour les navigateurs sans l'API ou quand elle est refusée. Le repli exige un geste de l'utilisateur (un appui).
 * Limites incompressibles : bouton de verrouillage, économiseur de batterie, ou réglage système qui force la veille.
 */

export type KeepAwakeStatus = 'off' | 'active' | 'needs-tap' | 'unsupported';

export interface KeepAwakeEnv {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  standalone?: boolean;
}

export function isIos(env: KeepAwakeEnv): boolean {
  return /iPad|iPhone|iPod/.test(env.userAgent) || (env.platform === 'MacIntel' && (env.maxTouchPoints ?? 0) > 1);
}

/**
 * Sur iOS, les PWA installées (écran d'accueil) ont longtemps accepté la requête Wake Lock sans effet réel :
 * on double alors avec la vidéo. Ailleurs, la vidéo ne sert que si l'API est absente ou refusée.
 */
export function needsVideoFallback(input: { wakeLockGranted: boolean; env: KeepAwakeEnv }): boolean {
  if (!input.wakeLockGranted) return true;
  return isIos(input.env) && input.env.standalone === true;
}

export function resolveStatus(input: {
  active: boolean;
  wakeLockGranted: boolean;
  videoPlaying: boolean;
  videoSupported: boolean;
  env: KeepAwakeEnv;
}): KeepAwakeStatus {
  if (!input.active) return 'off';
  const wantsVideo = needsVideoFallback({ wakeLockGranted: input.wakeLockGranted, env: input.env });
  if (input.wakeLockGranted && !wantsVideo) return 'active';
  if (input.videoPlaying) return 'active';
  if (input.wakeLockGranted) return 'active'; // iOS installée : le verrou est déjà demandé, la vidéo renforcera au premier appui
  return input.videoSupported ? 'needs-tap' : 'unsupported';
}

export function keepAwakeLabel(status: KeepAwakeStatus): string {
  switch (status) {
    case 'active':
      return 'Écran maintenu allumé';
    case 'needs-tap':
      return 'Touchez l’écran pour le garder allumé';
    case 'unsupported':
      return 'Veille non bloquable sur cet appareil : réglez « Veille » sur jamais';
    case 'off':
      return '';
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
