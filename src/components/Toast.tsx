import { CheckIcon } from './Icons';

interface ToastProps {
  visible: boolean;
  message: string;
}

export function Toast({ visible, message }: ToastProps) {
  return (
    <div id="saveToast" className={`save-toast${visible ? ' show' : ''}`} role="status">
      <CheckIcon />
      <span>{message}</span>
    </div>
  );
}
