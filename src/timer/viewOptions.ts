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

export interface ViewOptions {
  displayLayout: DisplayLayout;
  remoteLayout: RemoteLayout;
  /** Garde l'écran du téléphone allumé en mode télécommande. */
  remoteWakeLock: boolean;
  /** Disposition paysage (joueur 1 à gauche, chrono au centre, joueur 2 à droite) quand on tourne le téléphone. */
  landscape: boolean;
}

export const DISPLAY_LAYOUTS: DisplayLayout[] = ['timer', 'balanced', 'score'];
export const REMOTE_LAYOUTS: RemoteLayout[] = ['remote', 'classic'];

export function getDefaultViewOptions(): ViewOptions {
  return { displayLayout: 'timer', remoteLayout: 'remote', remoteWakeLock: true, landscape: false };
}

export function isDisplayLayout(value: unknown): value is DisplayLayout {
  return typeof value === 'string' && (DISPLAY_LAYOUTS as string[]).includes(value);
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
    landscape: typeof value.landscape === 'boolean' ? value.landscape : defaults.landscape,
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
  landscapeOption: boolean;
  isLandscape: boolean;
}): BoardLayout {
  if (landscapeOption && isLandscape) return 'landscape';
  return remoteActive ? 'remote' : 'classic';
}

/**
 * Orientation à verrouiller (app installée) : portrait tant que l'option paysage est désactivée,
 * rien (le téléphone décide) une fois activée. Le manifeste autorise toutes les orientations.
 */
export function orientationLockTarget(landscapeOption: boolean): 'portrait' | null {
  return landscapeOption ? null : 'portrait';
}
