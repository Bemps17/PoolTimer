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
