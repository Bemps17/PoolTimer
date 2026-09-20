import { CHANGELOG } from '../changelog';

interface ChangelogPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChangelogPanel({ open, onClose }: ChangelogPanelProps) {
  return (
    <>
      <div className={`overlay${open ? ' active' : ''}`} onClick={onClose} />
      <div
        className={`panel-help${open ? ' active' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="changelog-title"
      >
        <div className="header-panel">
          <h2 id="changelog-title">Historique des versions</h2>
          <button className="fermer-panel" onClick={onClose} aria-label="Fermer l'historique">
            &times;
          </button>
        </div>
        <div className="help-content">
          {CHANGELOG.map((entry) => (
            <article key={entry.version} className="changelog-entry">
              <h3>
                v{entry.version} — {entry.title}
              </h3>
              <p className="changelog-entry-meta">{entry.date}</p>
              <ul>
                {entry.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
