import type { SyncLevel } from '../mirror/syncLevel';
import { SyncDot } from './SyncDot';

interface DiagnosticsPanelProps {
  level: SyncLevel | null;
  rows: Array<[string, string]>;
  buildLog: () => string;
  fileName: string;
  onClear: () => void;
}

/** Mesures de synchro + journal (.log) à télécharger ou copier pour un diagnostic. */
export function DiagnosticsPanel({ level, rows, buildLog, fileName, onClear }: DiagnosticsPanelProps) {
  const download = () => {
    const blob = new Blob([buildLog()], { type: 'text/plain;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildLog());
    } catch {
      // copie refusée : le téléchargement reste possible
    }
  };

  return (
    <div className="diagnostics">
      {level ? (
        <p className="diagnostics-level">
          <SyncDot level={level} />
        </p>
      ) : null}
      <dl className="diagnostics-rows">
        {rows.map(([label, value]) => (
          <div key={label} className="diagnostics-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <button type="button" className="bouton-menu" onClick={download}>
        Télécharger le journal (.log)
      </button>
      <button type="button" className="bouton-menu" onClick={() => void copy()}>
        Copier le journal
      </button>
      <button type="button" className="bouton-menu bouton-menu-secondary" onClick={onClear}>
        Effacer le journal
      </button>
    </div>
  );
}
