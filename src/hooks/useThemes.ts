import { useCallback, useEffect, useState } from 'react';
import { addTheme, loadThemes, removeTheme, renameTheme, saveThemes, type CustomTheme } from '../timer/themes';
import type { Theme, ThemeColors } from '../timer/types';

export function useThemes() {
  const [themes, setThemes] = useState<CustomTheme[]>(() => loadThemes());

  useEffect(() => {
    saveThemes(themes);
  }, [themes]);

  const create = useCallback(
    (name: string, base: Theme, colors: ThemeColors) => setThemes((list) => addTheme(list, { name, base, colors })),
    [],
  );
  const rename = useCallback((id: string, name: string) => setThemes((list) => renameTheme(list, id, name)), []);
  const remove = useCallback((id: string) => setThemes((list) => removeTheme(list, id)), []);

  return { themes, create, rename, remove };
}

export type ThemesController = ReturnType<typeof useThemes>;
