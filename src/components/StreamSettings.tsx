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
import { NumberStepper } from './NumberStepper';
import { SegmentedField, ToggleField } from './SettingsControls';

interface StreamSettingsProps {
  room: string | null;
  onCopied: (message: string) => void;
}

const PARTS: Array<{ value: OverlayParts; label: string }> = [
  { value: 'timer', label: 'Chrono' },
  { value: 'both', label: 'Chrono + score' },
  { value: 'score', label: 'Score' },
];
const LAYOUTS: Array<{ value: OverlayLayout; label: string }> = [
  { value: 'row', label: 'Côte à côte' },
  { value: 'column', label: 'Empilés' },
];
const BACKGROUNDS: Array<{ value: OverlayBackground; label: string }> = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'dark', label: 'Sombre' },
  { value: 'chroma', label: 'Vert chroma' },
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
      <p className="settings-hint">
        Dans OBS ou Streamlabs : source <strong>Navigateur</strong> avec le lien ci-dessous (fond transparent, lecture seule).
      </p>
      <SegmentedField label="Contenu" value={options.parts} options={PARTS} onChange={(parts) => patch({ parts })} />
      {options.parts === 'both' ? (
        <SegmentedField label="Disposition" value={options.layout} options={LAYOUTS} onChange={(layout) => patch({ layout })} />
      ) : null}
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
      <SegmentedField
        label="Fond"
        value={options.background}
        options={BACKGROUNDS}
        onChange={(background) => patch({ background })}
      />
      {options.parts !== 'timer' ? (
        <>
          <ToggleField label="Noms" checked={options.showNames} onChange={(showNames) => patch({ showNames })} />
          <ToggleField label="Casses fermes (F)" checked={options.showFerme} onChange={(showFerme) => patch({ showFerme })} />
          <ToggleField label="Blanche (qui casse)" checked={options.showBreaker} onChange={(showBreaker) => patch({ showBreaker })} />
        </>
      ) : null}
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
