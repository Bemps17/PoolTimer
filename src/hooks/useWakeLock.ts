import { useEffect } from 'react';

/** Garde l'écran allumé (si le navigateur le permet) tant que `active` est vrai. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return undefined;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel = lock;
      } catch {
        // refusé (économie d'énergie, onglet masqué) : sans gravité
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
