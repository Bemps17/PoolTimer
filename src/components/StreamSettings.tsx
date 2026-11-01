import { useEffect, useState } from 'react';
import {
  loadOverlayOptions,
  OVERLAY_SCALE,
  overlayUrl,
  saveOverlayOptions,
  type OverlayBackground,
  type OverlayLayout,
  type OverlayOptions,
  type OverlayParts,
} from '../mirror/overlay';
import { NumberStepper, parseBooleanSelect, SelectField } from './NumberStepper';

interface StreamSettingsProps {
  room: string | null;
  onCopied: (message: string) => void;
}

const YES_NO = [
  { value: 'true', label: 'Oui' },
  { value: 'false', label: 'Non' },
];

const PARTS = [
  { value: 'both', label: 'Chrono + score' },
  { value: 'timer', label: 'Chrono seul' },
  { value: 'score', label: 'Score seul' },
];
const LAYOUTS = [
  { value: 'row', label: 'Côte à côte' },
  { value: 'column', label: 'Empilés' },
];
const BACKGROUNDS = [
  { value: 'transparent', label: 'Transparent (recommandé)' },
  { value: 'dark', label: 'Fond sombre semi-opaque' },
  { value: 'chroma', label: 'Vert chroma (#00FF00)' },
];

export function StreamSettings({ room, onCopied }: StreamSettingsProps) {
  const [options, setOptions] = useState<OverlayOptions>(() => loadOverlayOptions());

  useEffect(() => {
    saveOverlayOptions(options);
  }, [options]);

  const patch = (partial: Partial<OverlayOptions>) => setOptions((current) => ({ ...current, ...partial }));
  const url = room ? overlayUrl(window.location.origin, room, options) : null;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      onCopied('Lien overlay copié — collez-le dans une source Navigateur');
    } catch {
      onCopied(url);
    }
  };

  return (
    <>
      <p className="install-hint">
        Affichez le chrono et/ou le score dans OBS Studio ou Streamlabs : ajoutez une source <strong>Navigateur</strong>{' '}
        avec le lien ci-dessous (largeur 1280, hauteur 300 pour une bande ; décochez « Contrôler l’audio »). Lecture
        seule, fond transparent. Le chrono tourne même si l’écran Visuel est fermé.
      </p>
      <SelectField
        label="Contenu"
        htmlId="overlayParts"
        value={options.parts}
        options={PARTS}
        onChange={(parts) => patch({ parts: parts as OverlayParts })}
      />
      <SelectField
        label="Disposition"
        htmlId="overlayLayout"
        value={options.layout}
        options={LAYOUTS}
        onChange={(layout) => patch({ layout: layout as OverlayLayout })}
      />
      <NumberStepper
        label="Taille des chiffres du chrono"
        htmlId="overlayScale"
        value={options.scale}
        min={OVERLAY_SCALE.min}
        max={OVERLAY_SCALE.max}
        step={10}
        suffix="%"
        onChange={(scale) => patch({ scale })}
      />
      <SelectField
        label="Fond"
        htmlId="overlayBackground"
        value={options.background}
        options={BACKGROUNDS}
        onChange={(background) => patch({ background: background as OverlayBackground })}
      />
      <SelectField
        label="Noms sur le score"
        htmlId="overlayNames"
        value={String(options.showNames)}
        options={YES_NO}
        onChange={(value) => patch({ showNames: parseBooleanSelect(value) })}
      />
      <SelectField
        label="Casses fermes (F)"
        htmlId="overlayFerme"
        value={String(options.showFerme)}
        options={YES_NO}
        onChange={(value) => patch({ showFerme: parseBooleanSelect(value) })}
      />
      <SelectField
        label="Blanche (qui casse)"
        htmlId="overlayBreaker"
        value={String(options.showBreaker)}
        options={YES_NO}
        onChange={(value) => patch({ showBreaker: parseBooleanSelect(value) })}
      />
      {url ? (
        <>
          <p className="mirror-link">{url}</p>
          <button type="button" className="bouton-menu" onClick={() => void copy()}>
            Copier le lien overlay
          </button>
          <p className="install-hint">
            La salle est conservée sur cet appareil, même si vous fermez l’application : le lien OBS reste valable tant
            que vous n’utilisez pas « Fermer la salle ».
          </p>
        </>
      ) : (
        <p className="install-hint">Ouvrez d’abord une salle (section Miroir télécommande) pour obtenir le lien.</p>
      )}
    </>
  );
}
