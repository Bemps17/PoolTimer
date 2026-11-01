import { useEffect, useRef, useState } from 'react';

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

type LockTarget = 'portrait' | 'any' | 'landscape';
type LockableOrientation = ScreenOrientation & { lock?: (orientation: LockTarget) => Promise<void> };

/**
 * Demande l'orientation au téléphone (best effort). Accepté par Chrome Android en application installée,
 * refusé ailleurs (onglet de navigateur, iOS) : `onRefused` est alors appelé, sans autre conséquence.
 */
export function useOrientationLock(target: LockTarget, onRefused?: (target: LockTarget) => void): void {
  const refusedRef = useRef(onRefused);
  refusedRef.current = onRefused;
  useEffect(() => {
    const orientation = (typeof screen !== 'undefined' ? screen.orientation : undefined) as LockableOrientation | undefined;
    if (typeof orientation?.lock !== 'function') {
      refusedRef.current?.(target);
      return;
    }
    try {
      orientation.lock(target).catch(() => refusedRef.current?.(target));
    } catch {
      refusedRef.current?.(target);
    }
  }, [target]);
}
