import { useEffect, useRef, useState } from 'react';
import {
  PACK_LABELS,
  catalogById,
  defaultIdsForPack,
  isAlertPackId,
  isAlertPickMode,
  isCriticalAlertStyle,
  soundsForPack,
  toggleSoundId,
  type AlertPackId,
} from '../audio/soundCatalog';
import {
  deleteCustomSound,
  isAllowedAudioFile,
  listCustomSounds,
  saveCustomSound,
  type CustomSoundRecord,
} from '../audio/customSounds';
import { previewAlertSound } from '../audio/toneAudio';
import type { CriticalAlertStyle, TimerConfig } from '../timer/types';
import { SelectField } from './NumberStepper';

interface SoundLibrarySettingsProps {
  config: TimerConfig;
  onChange: (next: TimerConfig) => void;
}

const PACK_OPTIONS: { value: AlertPackId; label: string }[] = [
  { value: 'classic', label: PACK_LABELS.classic },
  { value: 'cretins', label: PACK_LABELS.cretins },
  { value: 'minionsLike', label: PACK_LABELS.minionsLike },
];

export function SoundLibrarySettings({ config, onChange }: SoundLibrarySettingsProps) {
  const [custom, setCustom] = useState<CustomSoundRecord[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void listCustomSounds()
      .then(setCustom)
      .catch(() => setCustom([]));
  }, []);

  const patch = (partial: Partial<TimerConfig>) => onChange({ ...config, ...partial });

  const applyPack = (pack: AlertPackId) => {
    const ids = defaultIdsForPack(pack, config.criticalAlertStyle);
    patch({
      alertPack: pack,
      alertWarningIds: ids.warning,
      alertCriticalIds: ids.critical,
      alertEndIds: ids.end,
    });
  };

  const applyStyle = (criticalAlertStyle: CriticalAlertStyle) => {
    const ids = defaultIdsForPack(config.alertPack, criticalAlertStyle);
    patch({ criticalAlertStyle, alertCriticalIds: ids.critical });
  };

  const packSounds = soundsForPack(config.alertPack);

  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setImportError(null);
    try {
      let nextConfig = config;
      for (const file of [...files]) {
        const problem = isAllowedAudioFile(file);
        if (problem) throw new Error(problem);
        const record = await saveCustomSound(file);
        nextConfig = {
          ...nextConfig,
          alertWarningIds: nextConfig.alertWarningIds.includes(record.id)
            ? nextConfig.alertWarningIds
            : [...nextConfig.alertWarningIds, record.id],
        };
      }
      onChange(nextConfig);
      setCustom(await listCustomSounds());
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import impossible');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeCustom = async (id: string) => {
    await deleteCustomSound(id);
    setCustom(await listCustomSounds());
    patch({
      alertWarningIds: config.alertWarningIds.filter((item) => item !== id),
      alertCriticalIds: config.alertCriticalIds.filter((item) => item !== id),
      alertEndIds: config.alertEndIds.filter((item) => item !== id),
    });
  };

  return (
    <div className="section-panel">
      <h3>Bibliothèque d’alertes</h3>
      <p className="install-hint">
        Packs <strong>originaux H8timer</strong> (pas de sons Ubisoft / Illumination). Choisissez un pack, un
        mode fixe ou aléatoire, et le style des 5 dernières secondes.
      </p>
      <SelectField
        label="Pack sonore"
        htmlId="alertPack"
        value={config.alertPack}
        options={PACK_OPTIONS}
        onChange={(value) => {
          if (isAlertPackId(value)) applyPack(value);
        }}
      />
      <SelectField
        label="Sélection"
        htmlId="alertPickMode"
        value={config.alertPickMode}
        options={[
          { value: 'fixed', label: 'Son fixe (premier coché)' },
          { value: 'random', label: 'Aléatoire parmi la sélection' },
        ]}
        onChange={(value) => {
          if (isAlertPickMode(value)) patch({ alertPickMode: value });
        }}
      />
      <SelectField
        label="Sous 5 secondes"
        htmlId="criticalAlertStyle"
        value={config.criticalAlertStyle}
        options={[
          { value: 'repeat', label: 'Bip chaque seconde jusqu’à zéro' },
          { value: 'oneshot', label: 'Un seul son d’environ 5 s' },
        ]}
        onChange={(value) => {
          if (isCriticalAlertStyle(value)) applyStyle(value);
        }}
      />

      <SoundTier
        title="Alerte (seuil orange)"
        ids={config.alertWarningIds}
        packSounds={packSounds.filter((sound) => sound.kind === 'warning' || sound.kind === 'tick')}
        custom={custom}
        config={config}
        onToggle={(id) => patch({ alertWarningIds: toggleSoundId(config.alertWarningIds, id) })}
      />
      <SoundTier
        title={config.criticalAlertStyle === 'oneshot' ? 'Critique (~5 s)' : 'Critique (bips 1 s)'}
        ids={config.alertCriticalIds}
        packSounds={packSounds.filter((sound) =>
          config.criticalAlertStyle === 'oneshot' ? sound.kind === 'oneshot5s' : sound.kind === 'tick',
        )}
        custom={custom}
        config={config}
        onToggle={(id) => patch({ alertCriticalIds: toggleSoundId(config.alertCriticalIds, id) })}
      />
      <SoundTier
        title="Fin (zéro)"
        ids={config.alertEndIds}
        packSounds={packSounds.filter((sound) => sound.kind === 'end')}
        custom={custom}
        config={config}
        onToggle={(id) => patch({ alertEndIds: toggleSoundId(config.alertEndIds, id) })}
      />

      <p className="install-hint">Importez vos propres fichiers audio pour les alertes (stockés sur cet appareil).</p>
      <input
        ref={fileRef}
        id="customSoundImport"
        className="sr-only"
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
        multiple
        onChange={(event) => {
          void importFiles(event.target.files);
        }}
      />
      <button type="button" className="bouton-menu" onClick={() => fileRef.current?.click()}>
        Importer un son
      </button>
      {importError ? <p className="install-hint sound-import-error">{importError}</p> : null}
      {custom.length > 0 ? (
        <ul className="sound-custom-list">
          {custom.map((clip) => (
            <li key={clip.id}>
              <span>{clip.name}</span>
              <button type="button" className="sound-preview" onClick={() => previewAlertSound(clip.id, config)}>
                Écouter
              </button>
              <button type="button" className="sound-preview" onClick={() => void removeCustom(clip.id)}>
                Retirer
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SoundTier({
  title,
  ids,
  packSounds,
  custom,
  config,
  onToggle,
}: {
  title: string;
  ids: string[];
  packSounds: { id: string; label: string }[];
  custom: CustomSoundRecord[];
  config: TimerConfig;
  onToggle: (id: string) => void;
}) {
  const options = new Map<string, string>();
  for (const sound of packSounds) options.set(sound.id, sound.label);
  for (const clip of custom) options.set(clip.id, `${clip.name} (import)`);
  for (const id of ids) {
    if (!options.has(id)) {
      const catalog = catalogById(id);
      options.set(id, catalog?.label ?? id);
    }
  }

  return (
    <fieldset className="sound-tier">
      <legend>{title}</legend>
      {[...options.entries()].map(([id, label]) => (
        <label key={id} className="sound-choice">
          <input type="checkbox" checked={ids.includes(id)} onChange={() => onToggle(id)} />
          <span>{label}</span>
          <button
            type="button"
            className="sound-preview"
            onClick={(event) => {
              event.preventDefault();
              previewAlertSound(id, config);
            }}
          >
            Écouter
          </button>
        </label>
      ))}
    </fieldset>
  );
}
