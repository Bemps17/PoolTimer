import { useEffect, useState } from 'react';
import {
  THEME_COLOR_GROUP_LABELS,
  THEME_COLOR_ZONES,
  normalizeHexColor,
  type ThemeColorGroup,
  type ThemeColorKey,
} from '../timer/theme';
import type { ThemeColors } from '../timer/types';

interface ThemeColorEditorProps {
  colors: ThemeColors;
  onChange: (colors: ThemeColors) => void;
}

const GROUP_ORDER: ThemeColorGroup[] = ['tableau', 'chrono', 'commandes', 'reglages'];

export function ThemeColorEditor({ colors, onChange }: ThemeColorEditorProps) {
  return (
    <div className="theme-color-editor" aria-label="Couleurs par zone">
      {GROUP_ORDER.map((group) => {
        const zones = THEME_COLOR_ZONES.filter((zone) => zone.group === group);
        return (
          <div key={group} className="settings-subsection">
            <h4>{THEME_COLOR_GROUP_LABELS[group]}</h4>
            <div className="theme-color-grid">
              {zones.map((zone) => (
                <ColorZoneField
                  key={zone.key}
                  colorKey={zone.key}
                  label={zone.label}
                  htmlId={`theme-color-${zone.key}`}
                  value={colors[zone.key]}
                  onChange={(next) => onChange({ ...colors, [zone.key]: next })}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ColorZoneFieldProps {
  colorKey: ThemeColorKey;
  label: string;
  htmlId: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorZoneField({ colorKey, label, htmlId, value, onChange }: ColorZoneFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;

  useEffect(() => {
    setDraft(null);
  }, [value]);

  const commit = (raw: string) => {
    onChange(normalizeHexColor(raw, value));
    setDraft(null);
  };

  return (
    <div className="theme-color-field parametre-groupe">
      <label htmlFor={htmlId}>{label}</label>
      <div className="theme-color-inputs">
        <input
          id={htmlId}
          type="color"
          value={normalizeHexColor(value, '#000000')}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} (${colorKey})`}
        />
        <input
          className="theme-color-hex"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={7}
          value={shown}
          aria-label={`Code hex ${label}`}
          onFocus={() => setDraft(value)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit(draft ?? value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
      </div>
    </div>
  );
}
