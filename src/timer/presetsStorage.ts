import { mergePresets, type CustomPreset } from './presets';

export const PRESETS_STORAGE_KEY = 'h8timer.presets';

export function loadPresets(
  storage: Pick<Storage, 'getItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): CustomPreset[] {
  try {
    const raw = storage?.getItem(PRESETS_STORAGE_KEY);
    return raw ? mergePresets(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function savePresets(
  presets: readonly CustomPreset[],
  storage: Pick<Storage, 'setItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): void {
  try {
    storage?.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // quota / mode privé : les presets restent en mémoire
  }
}
