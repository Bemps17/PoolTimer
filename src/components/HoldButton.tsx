import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Durée d'appui pour confirmer une action lourde (nouvelle manche) sans boîte de dialogue. */
export const HOLD_TO_CONFIRM_MS = 600;

interface HoldButtonProps {
  className?: string;
  id?: string;
  label: string;
  onConfirm: () => void;
  children: ReactNode;
}

/**
 * Bouton à appui long : une jauge se remplit pendant l'appui, l'action part à la fin.
 * Relâcher avant = rien. Clavier (Entrée / Espace) : action directe, pour l'accessibilité.
 */
export function HoldButton({ className, id, label, onConfirm, children }: HoldButtonProps) {
  const timer = useRef<number | null>(null);
  const [holding, setHolding] = useState(false);

  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  useEffect(() => cancel, []);

  return (
    <button
      type="button"
      id={id}
      className={`hold-button${holding ? ' holding' : ''}${className ? ` ${className}` : ''}`}
      aria-label={`${label} (appui long)`}
      style={{ ['--hold-ms' as string]: `${HOLD_TO_CONFIRM_MS}ms` }}
      onPointerDown={(event) => {
        if (typeof event.button === 'number' && event.button !== 0) return;
        cancel();
        setHolding(true);
        timer.current = window.setTimeout(() => {
          timer.current = null;
          setHolding(false);
          onConfirm();
        }, HOLD_TO_CONFIRM_MS);
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={(event) => {
        // detail 0 = activation clavier ; un clic souris / doigt passe par l'appui long.
        if (event.detail === 0) onConfirm();
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="hold-fill" aria-hidden />
      <span className="hold-content">{children}</span>
    </button>
  );
}
