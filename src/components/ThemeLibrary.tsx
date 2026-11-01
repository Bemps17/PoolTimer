import { useState } from 'react';
import type { ThemesController } from '../hooks/useThemes';
import { PRESET_NAME_MAX } from '../timer/presets';
import { applyCustomTheme, matchesTheme, THEMES_MAX, type CustomTheme } from '../timer/themes';
import type { TimerConfig } from '../timer/types';

interface ThemeLibraryProps {
  config: TimerConfig;
  controller: ThemesController;
  onApply: (next: TimerConfig) => void;
  onShare: (theme: CustomTheme) => void;
  onNotify: (message: string) => void;
}

export function ThemeLibrary({ config, controller, onApply, onShare, onNotify }: ThemeLibraryProps) {
  const { themes, create, rename, remove } = controller;
  const [name, setName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const full = themes.length >= THEMES_MAX;

  return (
    <div className="preset-manager">
      <h4 className="preset-manager-title">Mes thèmes</h4>
      {themes.length === 0 ? (
        <p className="install-hint">Aucun thème enregistré. Réglez vos couleurs puis enregistrez-les ci-dessous.</p>
      ) : (
        <ul className="preset-list">
          {themes.map((theme) => {
            const active = matchesTheme(config, theme);
            return (
              <li key={theme.id} className={`preset-item${active ? ' active' : ''}`}>
                {renamingId === theme.id ? (
                  <form
                    className="preset-rename"
                    onSubmit={(event) => {
                      event.preventDefault();
                      rename(theme.id, renameValue);
                      setRenamingId(null);
                    }}
                  >
                    <input
                      type="text"
                      value={renameValue}
                      maxLength={PRESET_NAME_MAX}
                      aria-label="Nouveau nom du thème"
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
                      style={{ background: `linear-gradient(165deg, ${theme.colors.primary}, ${theme.colors.bezel})` }}
                      onClick={() => {
                        onApply(applyCustomTheme(config, theme));
                        onNotify(`Thème « ${theme.name} » appliqué`);
                      }}
                    >
                      {theme.name}
                    </button>
                    <div className="preset-actions">
                      <button type="button" className="preset-mini" onClick={() => onShare(theme)}>Partager</button>
                      <button
                        type="button"
                        className="preset-mini"
                        onClick={() => {
                          setRenamingId(theme.id);
                          setRenameValue(theme.name);
                        }}
                      >
                        Renommer
                      </button>
                      <button
                        type="button"
                        className="preset-mini preset-danger"
                        onClick={() => {
                          if (window.confirm(`Supprimer le thème « ${theme.name} » ?`)) remove(theme.id);
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
          if (full) return;
          create(name.trim() || 'Mon thème', config.theme, config.colors);
          setName('');
          onNotify('Thème enregistré');
        }}
      >
        <label htmlFor="themeName" className="preset-create-label">Enregistrer l’apparence actuelle</label>
        <input
          id="themeName"
          type="text"
          value={name}
          maxLength={PRESET_NAME_MAX}
          placeholder="Nom (ex. Club bleu)"
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit" className="bouton-menu" disabled={full}>
          Enregistrer le thème
        </button>
        {full ? <p className="install-hint">Limite de {THEMES_MAX} thèmes atteinte.</p> : null}
      </form>
    </div>
  );
}
