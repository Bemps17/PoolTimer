import type { ShareEnvelope } from '../share/envelope';
import { describeTimings, diffTimings, timingsOf } from '../timer/presets';
import type { TimerConfig } from '../timer/types';

interface ImportDialogProps {
  envelope: ShareEnvelope;
  config: TimerConfig;
  onAdd: (apply: boolean) => void;
  onCancel: () => void;
}

const SWATCH_KEYS = ['background', 'bezel', 'screen', 'digitDefault', 'digitWarning', 'digitCritical', 'primary'] as const;

export function ImportDialog({ envelope, config, onAdd, onCancel }: ImportDialogProps) {
  const { preset, theme } = envelope;
  const change = preset ? diffTimings(timingsOf(config), preset) : '';

  return (
    <div className="lag-overlay" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div className="lag-card share-card">
        <h2 id="import-title">Importer un partage</h2>
        {preset ? (
          <section className="import-block">
            <h3>Preset « {preset.name} »</h3>
            <p>
              {describeTimings(preset)}
              {preset.raceTo ? ` · course à ${preset.raceTo}` : ''}
            </p>
            <p className="install-hint">{change ? `Changerait : ${change}` : 'Mêmes temps que vos réglages actuels.'}</p>
          </section>
        ) : null}
        {theme ? (
          <section className="import-block">
            <h3>Apparence « {theme.name} »</h3>
            <div className="import-swatches" aria-hidden>
              {SWATCH_KEYS.map((key) => (
                <span key={key} className="import-swatch" style={{ background: theme.colors[key] }} />
              ))}
            </div>
          </section>
        ) : null}
        <p className="install-hint">Rien n’est modifié tant que vous n’avez pas confirmé. Thème et sons ne changent pas, sauf partage d’apparence.</p>
        <button type="button" className="bouton-menu" onClick={() => onAdd(false)}>
          Ajouter à mes {preset && theme ? 'presets et thèmes' : preset ? 'presets' : 'thèmes'}
        </button>
        <button type="button" className="bouton-menu" onClick={() => onAdd(true)}>
          Ajouter et appliquer
        </button>
        <button type="button" className="bouton-menu bouton-menu-secondary" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </div>
  );
}
