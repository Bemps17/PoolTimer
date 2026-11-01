interface MatchEndDialogProps {
  winnerName: string;
  summary: string;
  onShare: (summary: string) => void;
  onNewMatch: () => void;
  onClose: () => void;
}

/** Fin de match : résumé partageable, nouveau match, ou fermer pour corriger le score. */
export function MatchEndDialog({ winnerName, summary, onShare, onNewMatch, onClose }: MatchEndDialogProps) {
  return (
    <div className="lag-overlay" role="dialog" aria-modal="true" aria-labelledby="match-end-title">
      <div className="lag-card share-card">
        <h2 id="match-end-title">Victoire de {winnerName}</h2>
        <pre className="match-end-summary">{summary}</pre>
        <button type="button" className="bouton-menu" onClick={() => onShare(summary)}>
          Partager le résultat
        </button>
        <button type="button" className="bouton-menu" onClick={onNewMatch}>
          Nouveau match
        </button>
        <button type="button" className="bouton-menu bouton-menu-secondary" onClick={onClose}>
          Fermer (corriger le score)
        </button>
      </div>
    </div>
  );
}
