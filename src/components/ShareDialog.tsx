import { useMemo, useState } from 'react';
import { QrCodeSvg } from '../mirror/QrCodeSvg';
import { buildShareUrl, envelopeToFileText, shareFileName, type ShareEnvelope } from '../share/envelope';
import type { CustomPreset } from '../timer/presets';
import type { CustomTheme } from '../timer/themes';
import type { TimerConfig } from '../timer/types';

export type ShareTarget = { kind: 'preset'; preset: CustomPreset } | { kind: 'theme'; theme: CustomTheme };

interface ShareDialogProps {
  target: ShareTarget;
  config: TimerConfig;
  onClose: () => void;
  onNotify: (message: string) => void;
}

const QR_MAX_CHARS = 1800;

export function ShareDialog({ target, config, onClose, onNotify }: ShareDialogProps) {
  const [withAppearance, setWithAppearance] = useState(false);

  const envelope: ShareEnvelope = useMemo(() => {
    if (target.kind === 'theme') {
      const { name, base, colors } = target.theme;
      return { kind: 'theme', theme: { name, base, colors } };
    }
    const { name, raceTo, tempsBase, tempsApresCasse, tempsExtension, seuilAlerte, seuilCritique } = target.preset;
    const preset = { name, raceTo, tempsBase, tempsApresCasse, tempsExtension, seuilAlerte, seuilCritique };
    if (!withAppearance) return { kind: 'preset', preset };
    return { kind: 'bundle', preset, theme: { name: `${name} (apparence)`, base: config.theme, colors: config.colors } };
  }, [target, withAppearance, config.theme, config.colors]);

  const url = buildShareUrl(window.location.origin, envelope);
  const title = target.kind === 'preset' ? target.preset.name : target.theme.name;
  const canNativeShare = typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      onNotify('Lien de partage copié');
    } catch {
      onNotify('Copie impossible : sélectionnez le lien');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: `H8timer — ${title}`, text: `H8timer : ${title}`, url });
    } catch {
      // annulé par l'utilisateur
    }
  };

  const download = () => {
    const blob = new Blob([envelopeToFileText(envelope)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = shareFileName(envelope);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  return (
    <div className="lag-overlay" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={onClose}>
      <div className="lag-card share-card" onClick={(event) => event.stopPropagation()}>
        <h2 id="share-title">Partager « {title} »</h2>
        {target.kind === 'preset' ? (
          <label className="preset-check">
            <input type="checkbox" checked={withAppearance} onChange={(event) => setWithAppearance(event.target.checked)} />
            Inclure mon apparence actuelle (couleurs)
          </label>
        ) : null}
        {url.length <= QR_MAX_CHARS ? (
          <QrCodeSvg value={url} title="QR code du partage" />
        ) : (
          <p className="install-hint">Contenu trop long pour un QR : utilisez le lien ou le fichier.</p>
        )}
        <p className="mirror-link">{url}</p>
        <button type="button" className="bouton-menu" onClick={() => void copy()}>
          Copier le lien
        </button>
        {canNativeShare ? (
          <button type="button" className="bouton-menu" onClick={() => void nativeShare()}>
            Partager…
          </button>
        ) : null}
        <button type="button" className="bouton-menu" onClick={download}>
          Télécharger le fichier
        </button>
        <button type="button" className="bouton-menu bouton-menu-secondary" onClick={onClose}>
          Fermer
        </button>
        <p className="install-hint">
          Le destinataire ouvre le lien (ou scanne le QR) : H8timer lui montre un aperçu et il confirme avant
          d’importer.
        </p>
      </div>
    </div>
  );
}
