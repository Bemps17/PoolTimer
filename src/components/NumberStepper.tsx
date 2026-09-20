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
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className="parametre-groupe">
      <label htmlFor={htmlId}>{label}</label>
      <div className="stepper">
        <button
          type="button"
          className="stepper-btn"
          aria-label={`Diminuer ${label}`}
          onClick={() => onChange(clamp(value - step))}
        >
          −
        </button>
        <div id={htmlId} className="stepper-value" aria-live="polite">
          {value}
          {suffix ? ` ${suffix}` : ''}
        </div>
        <button
          type="button"
          className="stepper-btn"
          aria-label={`Augmenter ${label}`}
          onClick={() => onChange(clamp(value + step))}
        >
          +
        </button>
      </div>
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
