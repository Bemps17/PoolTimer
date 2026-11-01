import { lazy, Suspense, useState } from 'react';
import { parseOverlayOptions, parseOverlayRoom } from './mirror/overlay';
import { parseDisplayRoom } from './mirror/protocol';

/**
 * Routeur : chaque vue est un morceau chargé à la demande. L'écran Visuel (/d/CODE) et l'overlay OBS (/o/CODE)
 * ne téléchargent ni le moteur audio, ni les réglages, ni le scoreur interactif.
 */
const ControllerApp = lazy(() => import('./ControllerApp'));
const DisplayView = lazy(() => import('./components/DisplayView').then((m) => ({ default: m.DisplayView })));
const OverlayView = lazy(() => import('./components/OverlayView').then((m) => ({ default: m.OverlayView })));

export default function App() {
  const [overlayRoom] = useState(() => {
    const room = parseOverlayRoom(window.location.pathname);
    // Fond transparent dès le premier rendu, avant même le chargement de la vue overlay (pas de flash dans OBS).
    if (room) document.documentElement.classList.add('overlay-mode');
    return room;
  });
  const [overlayOptions] = useState(() => parseOverlayOptions(window.location.search));
  const [displayRoom] = useState(() => parseDisplayRoom(window.location.pathname, window.location.search));
  return (
    <Suspense fallback={null}>
      {overlayRoom ? (
        <OverlayView room={overlayRoom} options={overlayOptions} />
      ) : displayRoom ? (
        <DisplayView room={displayRoom} />
      ) : (
        <ControllerApp />
      )}
    </Suspense>
  );
}
