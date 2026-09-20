import { useState } from 'react';
import { parseBooleanSelect, SelectField } from './NumberStepper';
import { QrCodeSvg } from '../mirror/QrCodeSvg';
import { formatMirrorDiagnostics } from '../mirror/diagnostics';
import { formatRoomCode } from '../mirror/protocol';
import type { ControllerSyncView } from '../mirror/syncStatus';
import { getMirrorRelayHost, isMirrorRelayConfigured } from '../mirror/wsUrl';
import { useMirrorDiagnostics, type MirrorConnectionStatus } from '../hooks/useMirror';

interface MirrorSettingsProps {
  betaEnabled: boolean;
  onBetaChange: (enabled: boolean) => void;
  room: string | null;
  status: MirrorConnectionStatus;
  error: string | null;
  displayCount: number;
  sync: ControllerSyncView;
  displayLink: string | null;
  onCreateRoom: () => void;
  onCloseRoom: () => void;
  onCopyLink: () => void;
  onCopyLogs: (text: string) => void;
}

const YES_NO = [
  { value: 'true', label: 'Oui' },
  { value: 'false', label: 'Non' },
];

export function MirrorSettings({
  betaEnabled,
  onBetaChange,
  room,
  status,
  error,
  displayCount,
  sync,
  displayLink,
  onCreateRoom,
  onCloseRoom,
  onCopyLink,
  onCopyLogs,
}: MirrorSettingsProps) {
  const configured = isMirrorRelayConfigured();
  const live = Boolean(room) && status !== 'idle';
  const diagnostics = useMirrorDiagnostics();
  const copyText = formatMirrorDiagnostics(diagnostics);
  const relayHost = getMirrorRelayHost();

  const statusText = (() => {
    if (!configured) return 'Relais non configuré.';
    if (status === 'live') {
      return displayCount > 0 ? sync.detail : 'Salle active · en attente d’un écran';
    }
    switch (status) {
      case 'connecting':
        return 'Connexion au relais…';
      case 'error':
        return error ?? 'Erreur de connexion';
      case 'idle':
        return 'Aucune salle ouverte.';
      default: {
        const exhaustive: never = status;
        return exhaustive;
      }
    }
  })();

  return (
    <div className="section-panel">
      <h3>
        Bêta / Work in progress <span className="beta-badge">Bêta</span>
      </h3>
      <p className="install-hint">
        Miroir télécommande : le téléphone reste la commande, une tablette ou un PC affiche le chrono via
        Internet (code court + QR).
      </p>
      <SelectField
        label="Miroir télécommande"
        htmlId="betaMirror"
        value={String(betaEnabled)}
        options={YES_NO}
        onChange={(value) => onBetaChange(parseBooleanSelect(value))}
      />
      {betaEnabled ? (
        <>
          {!configured ? (
            <p className="install-hint">
              Définissez <code>VITE_MIRROR_WS_URL</code> (Worker Cloudflare) puis rebuild. Voir le README.
            </p>
          ) : null}
          {live && room && displayLink ? (
            <div className="mirror-room-card">
              <p className="mirror-room-code" aria-label="Code salle">
                {formatRoomCode(room)}
              </p>
              <p className={`install-hint mirror-sync mirror-sync-${sync.health}`}>{statusText}</p>
              <QrCodeSvg value={displayLink} title="QR code de l’écran miroir" />
              <p className="mirror-link">{displayLink}</p>
              <button type="button" className="bouton-menu" onClick={onCopyLink}>
                Copier le lien
              </button>
              <button type="button" className="bouton-menu bouton-menu-secondary" onClick={onCloseRoom}>
                Fermer la salle
              </button>
            </div>
          ) : (
            <button type="button" className="bouton-menu" onClick={onCreateRoom} disabled={!configured}>
              Ouvrir une salle
            </button>
          )}
          <div className="mirror-diag">
            <h4>Diagnostic miroir</h4>
            <p className="install-hint">
              Relais : <code>{relayHost ?? 'non configuré'}</code>. Copiez ces logs (codes{' '}
              <code>bad_push</code>, <code>unauthorized</code>, <code>stale_seq</code>, <code>room_busy</code>,{' '}
              <code>ws_close</code>…) pour un diagnostic précis.
            </p>
            <pre className="mirror-diag-log" aria-label="Journaux miroir">
              {copyText}
            </pre>
            <button type="button" className="bouton-menu" onClick={() => onCopyLogs(copyText)}>
              Copier les logs
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function MirrorLogCopyButton({ onCopied }: { onCopied?: () => void }) {
  const diagnostics = useMirrorDiagnostics();
  const [copied, setCopied] = useState(false);
  const copyText = formatMirrorDiagnostics(diagnostics);

  return (
    <button
      type="button"
      className="bouton-menu bouton-menu-secondary"
      onClick={(event) => {
        event.stopPropagation();
        void navigator.clipboard.writeText(copyText).then(
          () => {
            setCopied(true);
            onCopied?.();
            window.setTimeout(() => setCopied(false), 2000);
          },
          () => {
            setCopied(false);
          },
        );
      }}
    >
      {copied ? 'Logs copiés' : 'Copier les logs'}
    </button>
  );
}
