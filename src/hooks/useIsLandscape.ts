import { useEffect, useState } from 'react';

const QUERY = '(orientation: landscape)';

function current(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

/** Vrai quand l'écran est plus large que haut (téléphone tourné). Suit la rotation en direct. */
export function useIsLandscape(): boolean {
  const [landscape, setLandscape] = useState(current);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(QUERY);
    const update = () => setLandscape(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return landscape;
}

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'portrait') => Promise<void>;
  unlock?: () => void;
};

/**
 * Applique le verrouillage d'orientation (best effort) : accepté par Android en app installée,
 * refusé ailleurs (onglet de navigateur, iOS) — sans conséquence, l'erreur est ignorée.
 */
export function useOrientationLock(target: 'portrait' | null): void {
  useEffect(() => {
    const orientation = (typeof screen !== 'undefined' ? screen.orientation : undefined) as LockableOrientation | undefined;
    if (!orientation) return;
    try {
      if (target) {
        void orientation.lock?.(target)?.catch(() => undefined);
      } else {
        orientation.unlock?.();
      }
    } catch {
      // API absente ou refusée : le téléphone garde son comportement
    }
  }, [target]);
}
