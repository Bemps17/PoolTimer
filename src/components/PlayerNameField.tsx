import { useEffect, useRef, useState } from 'react';
import { PLAYER_NAME_MAX_LENGTH, clampPlayerNameInput, displayPlayerName, storedPlayerName } from '../timer/playerName';

interface PlayerNameFieldProps {
  label: string;
  nameId: string;
  colorId: string;
  name: string;
  color: string;
  seat: 1 | 2;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
}

export function PlayerNameField({
  label,
  nameId,
  colorId,
  name,
  color,
  seat,
  onNameChange,
  onColorChange,
}: PlayerNameFieldProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholder = displayPlayerName('', seat);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    onNameChange(storedPlayerName(name));
    setEditing(false);
  };

  return (
    <div className="parametre-groupe">
      <label htmlFor={editing ? nameId : undefined}>{label}</label>
      <div className="player-config">
        {editing ? (
          <input
            ref={inputRef}
            id={nameId}
            type="text"
            maxLength={PLAYER_NAME_MAX_LENGTH}
            value={name}
            placeholder={placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint="done"
            onChange={(event) => onNameChange(clampPlayerNameInput(event.target.value))}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit();
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
            <span className={name.trim() ? undefined : 'name-placeholder'}>
              {name.trim() ? name : placeholder}
            </span>
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
