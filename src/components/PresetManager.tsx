import { useState } from 'react';
import type { PresetsController } from '../hooks/usePresets';
import {
  applyPreset,
  BUILTIN_PRESET_NAMES,
  builtinTimings,
  describeTimings,
  summarizeTimingChanges,
  matchesPreset,
  PRESET_NAME_MAX,
  PRESETS_MAX,
  timingsOf,
  type CustomPreset,
  type PresetTimings,
} from '../timer/presets';
import { COMPETITION_MODES } from '../timer/config';
import type { TimerConfig } from '../timer/types';

interface PresetManagerProps {
  config: TimerConfig;
  controller: PresetsController;
  onApply: (next: TimerConfig) => void;
  onNotify: (message: string) => void;
  onShare: (preset: CustomPreset) => void;
}

type Source = 'current' | (typeof COMPETITION_MODES)[number];

export function PresetManager({ config, controller, onApply, onNotify, onShare }: PresetManagerProps) {
  const { presets, create, rename, duplicate, remove } = controller;
  const [name, setName] = useState('');
  const [source, setSource] = useState<Source>('current');
  const [includeRace, setIncludeRace] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const full = presets.length >= PRESETS_MAX;

  const apply = (preset: CustomPreset) => {
    const change = summarizeTimingChanges(config, preset);
    onApply(applyPreset(config, preset));
    onNotify(change ? `« ${preset.name} » appliqué : ${change}` : `« ${preset.name} » déjà actif`);
  };

  const submit = () => {
    const timings: PresetTimings = source === 'current' ? timingsOf(config) : builtinTimings(source);
    const fallback = source === 'current' ? 'Mon preset' : `${BUILTIN_PRESET_NAMES[source]} (perso)`;
    create(name.trim() || fallback, timings, includeRace && config.matchOptions.targetScore > 0 ? config.matchOptions.targetScore : null);
    setName('');
    onNotify('Preset enregistré');
  };

  return (
    <div className="preset-manager">
      <h4 className="preset-manager-title">Mes presets</h4>
      {presets.length === 0 ? (
        <p className="install-hint">Aucun preset personnel. Créez-en un ci-dessous à partir de vos réglages ou d’un preset FFB.</p>
      ) : (
        <ul className="preset-list">
          {presets.map((preset) => {
            const active = matchesPreset(config, preset);
            const editing = renamingId === preset.id;
            return (
              <li key={preset.id} className={`preset-item${active ? ' active' : ''}`}>
                {editing ? (
                  <form
                    className="preset-rename"
                    onSubmit={(event) => {
                      event.preventDefault();
                      rename(preset.id, renameValue);
                      setRenamingId(null);
                    }}
                  >
                    <input
                      type="text"
                      value={renameValue}
                      maxLength={PRESET_NAME_MAX}
                      aria-label="Nouveau nom du preset"
                      onChange={(event) => setRenameValue(event.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="preset-mini">OK</button>
                    <button type="button" className="preset-mini" onClick={() => setRenamingId(null)}>Annuler</button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`preset-card preset-custom${active ? ' active' : ''}`}
                      aria-pressed={active}
                      onClick={() => apply(preset)}
                    >
                      {preset.name}
                      <small>
                        {describeTimings(preset)}
                        {preset.raceTo ? ` · course à ${preset.raceTo}` : ''}
                      </small>
                    </button>
                    <div className="preset-actions">
                      <button type="button" className="preset-mini" onClick={() => onShare(preset)}>
                        Partager
                      </button>
                      <button
                        type="button"
                        className="preset-mini"
                        onClick={() => {
                          setRenamingId(preset.id);
                          setRenameValue(preset.name);
                        }}
                      >
                        Renommer
                      </button>
                      <button type="button" className="preset-mini" onClick={() => duplicate(preset.id)} disabled={full}>
                        Dupliquer
                      </button>
                      <button
                        type="button"
                        className="preset-mini preset-danger"
                        onClick={() => {
                          if (window.confirm(`Supprimer le preset « ${preset.name} » ?`)) remove(preset.id);
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="preset-create"
        onSubmit={(event) => {
          event.preventDefault();
          if (!full) submit();
        }}
      >
        <label htmlFor="presetName" className="preset-create-label">Nouveau preset</label>
        <input
          id="presetName"
          type="text"
          value={name}
          maxLength={PRESET_NAME_MAX}
          placeholder="Nom (ex. Ligue du jeudi)"
          onChange={(event) => setName(event.target.value)}
        />
        <label htmlFor="presetSource" className="preset-create-label">Partir de</label>
        <select id="presetSource" value={source} onChange={(event) => setSource(event.target.value as Source)}>
          <option value="current">Mes réglages actuels ({describeTimings(config)})</option>
          {COMPETITION_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {BUILTIN_PRESET_NAMES[mode]} ({describeTimings(builtinTimings(mode))})
            </option>
          ))}
        </select>
        {config.matchOptions.targetScore > 0 ? (
          <label className="preset-check">
            <input type="checkbox" checked={includeRace} onChange={(event) => setIncludeRace(event.target.checked)} />
            Inclure la course à {config.matchOptions.targetScore}
          </label>
        ) : null}
        <button type="submit" className="bouton-menu" disabled={full}>
          Enregistrer le preset
        </button>
        {full ? <p className="install-hint">Limite de {PRESETS_MAX} presets atteinte.</p> : null}
        <p className="install-hint">
          Un preset ne règle que le chronométrage (et la course à N si coché). Thème, couleurs et sons ne changent pas.
        </p>
      </form>
    </div>
  );
}
