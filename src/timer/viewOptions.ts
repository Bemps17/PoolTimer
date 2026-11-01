/**
 * Options d'affichage (indépendantes des presets de chronométrage et du thème).
 * Priorité produit : le chrono doit toujours être très lisible, le score est secondaire.
 */

/** Mise en page de l'écran Visuel (miroir), pilotée depuis la télécommande. */
export type DisplayLayout = 'timer' | 'balanced' | 'score';
/** Vue de la télécommande quand une salle miroir est ouverte. */
export type RemoteLayout = 'remote' | 'classic';
export type RemoteScoreMode = 'compact' | 'full' | 'hidden';

export interface ViewOptions {
  displayLayout: DisplayLayout;
  remoteLayout: RemoteLayout;
  remoteScore: RemoteScoreMode;
  /** Garde l'écran du téléphone allumé en mode télécommande. */
  remoteWakeLock: boolean;
}

export const DISPLAY_LAYOUTS: DisplayLayout[] = ['timer', 'balanced', 'score'];
export const REMOTE_LAYOUTS: RemoteLayout[] = ['remote', 'classic'];
export const REMOTE_SCORE_MODES: RemoteScoreMode[] = ['compact', 'full', 'hidden'];

export function getDefaultViewOptions(): ViewOptions {
  return { displayLayout: 'timer', remoteLayout: 'remote', remoteScore: 'compact', remoteWakeLock: true };
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
    remoteScore: (REMOTE_SCORE_MODES as unknown[]).includes(value.remoteScore)
      ? (value.remoteScore as RemoteScoreMode)
      : defaults.remoteScore,
    remoteWakeLock: typeof value.remoteWakeLock === 'boolean' ? value.remoteWakeLock : defaults.remoteWakeLock,
  };
}

/** Vue télécommande active : une salle est ouverte ET l'option n'est pas « classique ». */
export function isRemoteViewActive(hasRoom: boolean, options: Pick<ViewOptions, 'remoteLayout'>): boolean {
  return hasRoom && options.remoteLayout === 'remote';
}
