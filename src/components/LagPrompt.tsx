import { displayPlayerName } from '../timer/playerName';
import type { PlayerId } from '../timer/types';

interface LagPromptProps {
  p1Name: string;
  p2Name: string;
  p1Color: string;
  p2Color: string;
  onChoose: (winner: PlayerId) => void;
  onSkip: () => void;
}

/** Tirage à la bande : désigne le premier casseur, une seule fois au début du match (joueur ou équipe). */
export function LagPrompt({ p1Name, p2Name, p1Color, p2Color, onChoose, onSkip }: LagPromptProps) {
  return (
    <div className="lag-overlay" role="dialog" aria-modal="true" aria-labelledby="lag-title">
      <div className="lag-card">
        <h2 id="lag-title">Tirage à la bande</h2>
        <p>Qui a gagné la bande ? Il (ou elle, ou l’équipe) casse en premier.</p>
        <button type="button" className="lag-choice" style={{ borderColor: p1Color }} onClick={() => onChoose(1)}>
          {displayPlayerName(p1Name, 1)}
        </button>
        <button type="button" className="lag-choice" style={{ borderColor: p2Color }} onClick={() => onChoose(2)}>
          {displayPlayerName(p2Name, 2)}
        </button>
        <button type="button" className="bouton-menu bouton-menu-secondary" onClick={onSkip}>
          Passer
        </button>
      </div>
    </div>
  );
}
