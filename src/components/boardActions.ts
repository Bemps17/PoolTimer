import type { PlayerId } from '../timer/types';

/** Commandes communes aux écrans de jeu (portrait télécommande et paysage). */
export interface BoardActions {
  onTogglePlayPause: () => void;
  onResetShot: () => void;
  onApresCasse: () => void;
  onExtension: () => void;
  onNewGame: () => void;
  onSelectPlayer: (player: PlayerId) => void;
  onToggleMenu: () => void;
}

/** Petit retour tactile à chaque commande (si la vibration est activée et disponible). */
export function haptic(enabled: boolean): void {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(12);
  } catch {
    // vibration refusée par le navigateur : sans effet
  }
}
