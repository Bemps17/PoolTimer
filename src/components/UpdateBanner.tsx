import { formatUpdateMessage } from '../pwa/updatePrompt';

interface UpdateBannerProps {
  visible: boolean;
  incomingVersion?: string;
  onUpdate: () => void;
}

export function UpdateBanner({ visible, incomingVersion, onUpdate }: UpdateBannerProps) {
  if (!visible) return null;

  return (
    <div className="update-banner" role="status">
      <span>{formatUpdateMessage(incomingVersion)}</span>
      <button type="button" className="update-banner-button" onClick={onUpdate}>
        Mettre à jour
      </button>
    </div>
  );
}
