import { CheckIcon } from './Icons';

interface ToastProps {
  visible: boolean;
}

export function Toast({ visible }: ToastProps) {
  return (
    <div id="saveToast" className={`save-toast${visible ? ' show' : ''}`} role="status">
      <CheckIcon />
      <span>Paramètres sauvegardés !</span>
    </div>
  );
}
