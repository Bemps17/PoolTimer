import { useEffect, useRef, useState } from 'react';

interface PlayerNameFieldProps {
  label: string;
  nameId: string;
  colorId: string;
  name: string;
  color: string;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
}

export function PlayerNameField({
  label,
  nameId,
  colorId,
  name,
  color,
  onNameChange,
  onColorChange,
}: PlayerNameFieldProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div className="parametre-groupe">
      <label htmlFor={editing ? nameId : undefined}>{label}</label>
      <div className="player-config">
        {editing ? (
          <input
            ref={inputRef}
            id={nameId}
            type="text"
            maxLength={5}
            value={name}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint="done"
            onChange={(event) => onNameChange(event.target.value.substring(0, 5))}
            onBlur={() => setEditing(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                setEditing(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="name-readonly"
            onClick={() => setEditing(true)}
            aria-label={`Modifier le nom ${label}`}
          >
            <span>{name}</span>
            <span className="name-edit-hint">modifier</span>
          </button>
        )}
        <input
          id={colorId}
          type="color"
          value={color}
          onChange={(event) => onColorChange(event.target.value)}
          aria-label={`Couleur ${label}`}
        />
      </div>
    </div>
  );
}
