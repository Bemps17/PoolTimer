import { useCallback, useEffect, useState } from 'react';
import {
  addPreset,
  duplicatePreset,
  removePreset,
  renamePreset,
  type CustomPreset,
  type PresetTimings,
} from '../timer/presets';
import { loadPresets, savePresets } from '../timer/presetsStorage';

export function usePresets() {
  const [presets, setPresets] = useState<CustomPreset[]>(() => loadPresets());

  useEffect(() => {
    savePresets(presets);
  }, [presets]);

  const create = useCallback(
    (name: string, timings: PresetTimings, raceTo: number | null) =>
      setPresets((list) => addPreset(list, { name, timings, raceTo })),
    [],
  );
  const rename = useCallback((id: string, name: string) => setPresets((list) => renamePreset(list, id, name)), []);
  const duplicate = useCallback((id: string) => setPresets((list) => duplicatePreset(list, id)), []);
  const remove = useCallback((id: string) => setPresets((list) => removePreset(list, id)), []);

  return { presets, create, rename, duplicate, remove };
}

export type PresetsController = ReturnType<typeof usePresets>;
