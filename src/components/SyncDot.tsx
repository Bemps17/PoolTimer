import { syncLevelLabel, type SyncLevel } from '../mirror/syncLevel';

interface SyncDotProps {
  level: SyncLevel;
  /** Appui = ouvrir le diagnostic (écran Visuel). */
  onOpen?: () => void;
}

/** Voyant de synchro : vert OK, orange latence, rouge interrompu. Aucun texte visible. */
export function SyncDot({ level, onOpen }: SyncDotProps) {
  const label = syncLevelLabel(level);
  const dot = <span className={`sync-dot sync-dot-${level}`} role="img" aria-label={label} title={label} />;
  if (!onOpen) return dot;
  return (
    <button type="button" className="sync-dot-button" aria-label={`${label} — ouvrir le diagnostic`} onClick={onOpen}>
      {dot}
    </button>
  );
}
