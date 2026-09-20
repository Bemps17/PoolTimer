import { useState } from 'react';
import { commitIntegerField } from '../timer/numberField';

interface NumberStepperProps {
  label: string;
  htmlId: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export function NumberStepper({
  label,
  htmlId,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: NumberStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const shown = draft ?? String(value);

  const commitDraft = (raw: string) => {
    onChange(commitIntegerField(raw, value, min, max));
    setDraft(null);
  };

  const stepBy = (delta: number) => {
    const base = draft !== null ? commitIntegerField(draft, value, min, max) : value;
    setDraft(null);
    onChange(clamp(base + delta));
  };

  return (
    <div className="parametre-groupe">
      <label htmlFor={htmlId}>{label}</label>
      <div className="stepper">
        <button
          type="button"
          className="stepper-btn"
          aria-label={`Diminuer ${label}`}
          onClick={() => stepBy(-step)}
        >
          −
        </button>
        <input
          id={htmlId}
          className="stepper-value stepper-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={shown}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={`${label}, entre ${min} et ${max}${suffix ? ` ${suffix}` : ''}`}
          onFocus={() => setDraft(String(value))}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commitDraft(draft ?? String(value))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
        <button
          type="button"
          className="stepper-btn"
          aria-label={`Augmenter ${label}`}
          onClick={() => stepBy(step)}
        >
          +
        </button>
      </div>
      {suffix ? <p className="stepper-suffix-hint">{suffix} · {min}–{max}</p> : null}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  htmlId: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function SelectField({ label, htmlId, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="parametre-groupe">
      <label htmlFor={htmlId}>{label}</label>
      <select id={htmlId} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface VolumeSliderProps {
  label: string;
  htmlId: string;
  gain: number;
  onChange: (gain: number) => void;
}

export function VolumeSlider({ label, htmlId, gain, onChange }: VolumeSliderProps) {
  return (
    <div className="parametre-groupe">
      <label htmlFor={htmlId}>{label}</label>
      <input
        id={htmlId}
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={Number.isFinite(gain) ? gain : 0}
        onChange={(event) => onChange(Number.parseFloat(event.target.value))}
      />
    </div>
  );
}

export function booleanSelect(value: boolean): string {
  return value ? 'true' : 'false';
}

export function parseBooleanSelect(value: string): boolean {
  return value === 'true';
}
