import { useRef, useState } from 'react';
import { decodeShareText, readShareFile, type ShareEnvelope } from '../share/envelope';

interface ImportPanelProps {
  onImport: (envelope: ShareEnvelope) => void;
}

export function ImportPanel({ onImport }: ImportPanelProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handle = (result: ReturnType<typeof decodeShareText>) => {
    if (result.ok) {
      setError(null);
      setText('');
      onImport(result.envelope);
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <p className="install-hint">
        Recevez un lien ou un fichier de partage d’un autre arbitre ? Ouvrez simplement le lien, ou importez-le ici. Un
        aperçu s’affiche avant toute modification.
      </p>
      <label htmlFor="importText" className="preset-create-label">Lien ou code de partage</label>
      <textarea
        id="importText"
        className="import-text"
        rows={3}
        value={text}
        placeholder="https://… #h8=…"
        onChange={(event) => setText(event.target.value)}
      />
      <button type="button" className="bouton-menu" onClick={() => handle(decodeShareText(text))} disabled={!text.trim()}>
        Importer le lien ou le code
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void readShareFile(file).then(handle);
        }}
      />
      <button type="button" className="bouton-menu" onClick={() => fileRef.current?.click()}>
        Importer un fichier (.json)
      </button>
      {error ? (
        <p className="install-hint import-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
