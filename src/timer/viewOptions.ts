/**
 * Options d'affichage (indépendantes des presets de chronométrage et du thème).
 * Priorité produit : le chrono doit toujours être très lisible, le score est secondaire.
 */

/** Mise en page de l'écran Visuel (miroir), pilotée depuis la télécommande. */
export type DisplayLayout = 'timer' | 'balanced' | 'score';
/** Vue de la télécommande quand une salle miroir est ouverte. */
export type RemoteLayout = 'remote' | 'classic';
/** Disposition effective de l'écran de jeu du téléphone. */
export type BoardLayout = 'classic' | 'remote' | 'landscape';
/** Paysage : non (portrait verrouillé), auto (suit la rotation), forcé (écran verrouillé en paysage). */
export type LandscapeMode = 'off' | 'auto' | 'force';
export const LANDSCAPE_MODES: LandscapeMode[] = ['off', 'auto', 'force'];

export interface ViewOptions {
  displayLayout: DisplayLayout;
  remoteLayout: RemoteLayout;
  /** Garde l'écran du téléphone allumé en mode télécommande. */
  remoteWakeLock: boolean;
  /** Disposition paysage (joueur 1 à gauche, chrono au centre, joueur 2 à droite). */
  landscape: LandscapeMode;
}

export const DISPLAY_LAYOUTS: DisplayLayout[] = ['timer', 'balanced', 'score'];
export const REMOTE_LAYOUTS: RemoteLayout[] = ['remote', 'classic'];

export function getDefaultViewOptions(): ViewOptions {
  return { displayLayout: 'timer', remoteLayout: 'remote', remoteWakeLock: true, landscape: 'off' };
}

export function isDisplayLayout(value: unknown): value is DisplayLayout {
  return typeof value === 'string' && (DISPLAY_LAYOUTS as string[]).includes(value);
}

function parseLandscapeMode(value: unknown, fallback: LandscapeMode): LandscapeMode {
  // 3.4 : interrupteur booléen (activé = suit la rotation).
  if (value === true) return 'auto';
  if (value === false) return 'off';
  return (LANDSCAPE_MODES as unknown[]).includes(value) ? (value as LandscapeMode) : fallback;
}

export function mergeViewOptions(raw: unknown): ViewOptions {
  const defaults = getDefaultViewOptions();
  if (!raw || typeof raw !== 'object') return defaults;
  const value = raw as Partial<Record<keyof ViewOptions, unknown>>;
  return {
    displayLayout: isDisplayLayout(value.displayLayout) ? value.displayLayout : defaults.displayLayout,
    remoteLayout: (REMOTE_LAYOUTS as unknown[]).includes(value.remoteLayout)
      ? (value.remoteLayout as RemoteLayout)
      : defaults.remoteLayout,
    remoteWakeLock: typeof value.remoteWakeLock === 'boolean' ? value.remoteWakeLock : defaults.remoteWakeLock,
    landscape: parseLandscapeMode(value.landscape, defaults.landscape),
  };
}

/** Vue télécommande active : une salle est ouverte ET l'option n'est pas « classique ». */
export function isRemoteViewActive(hasRoom: boolean, options: Pick<ViewOptions, 'remoteLayout'>): boolean {
  return hasRoom && options.remoteLayout === 'remote';
}

/**
 * Disposition de l'écran de jeu : paysage seulement si l'option est activée ET le téléphone tourné ;
 * sinon portrait (télécommande dédiée si une salle est ouverte, écran classique sinon).
 */
export function boardLayout({
  remoteActive,
  landscapeOption,
  isLandscape,
}: {
  remoteActive: boolean;
  landscapeOption: LandscapeMode;
  isLandscape: boolean;
}): BoardLayout {
  if (landscapeOption !== 'off' && isLandscape) return 'landscape';
  return remoteActive ? 'remote' : 'classic';
}

/**
 * Orientation demandée au téléphone (app installée). Chrome Android garde le manifeste d'installation
 * (ancien verrou portrait) : « déverrouiller » y revient, donc on demande explicitement « any » en Auto.
 */
export function orientationLockTarget(mode: LandscapeMode): 'portrait' | 'any' | 'landscape' {
  switch (mode) {
    case 'off':
      return 'portrait';
    case 'auto':
      return 'any';
    case 'force':
      return 'landscape';
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}
