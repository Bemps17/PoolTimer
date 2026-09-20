import { useState, type ReactNode, type ToggleEvent } from 'react';

interface SettingsSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function SettingsSection({ title, defaultOpen = false, children }: SettingsSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const handleToggle = (event: ToggleEvent<HTMLDetailsElement>) => {
    setOpen(event.currentTarget.open);
  };

  return (
    <details className="settings-section" open={open} onToggle={handleToggle}>
      <summary>
        <span className="settings-section-title">{title}</span>
      </summary>
      <div className="settings-section-body">{children}</div>
    </details>
  );
}
