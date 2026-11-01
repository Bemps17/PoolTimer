import { useId, type ReactNode } from 'react';

/** Interrupteur : un seul appui (au lieu d'une liste Oui / Non). Toute la ligne est cliquable (≥ 44 px). */
export function ToggleField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  hint?: string;
}) {
  const hintId = useId();
  return (
    <div className="settings-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        className={`settings-toggle-row${checked ? ' on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="settings-toggle-label">{label}</span>
        <span className="settings-switch" aria-hidden>
          <span className="settings-switch-knob" />
        </span>
      </button>
      {hint ? (
        <p id={hintId} className="settings-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Choix segmenté (2 à 3 options) : tout est visible, un appui suffit. */
export function SegmentedField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
  hint?: string;
}) {
  const labelId = useId();
  return (
    <div className="settings-segmented">
      <span id={labelId} className="settings-field-label">
        {label}
      </span>
      <div className="settings-segments" role="radiogroup" aria-labelledby={labelId}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={`settings-segment${value === option.value ? ' active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {hint ? <p className="settings-hint">{hint}</p> : null}
    </div>
  );
}

/** Carte de section : toujours ouverte (pas de tap pour la déplier). */
export function SettingsCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings-card">
      <h3 className="settings-card-title">{title}</h3>
      <div className="settings-card-body">{children}</div>
    </section>
  );
}

/** Réglages rarement utilisés : repliés par défaut. */
export function SettingsDisclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="settings-disclosure">
      <summary>{title}</summary>
      <div className="settings-disclosure-body">{children}</div>
    </details>
  );
}
