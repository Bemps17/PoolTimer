import { formatUpdateMessage } from '../pwa/updatePrompt';

interface UpdateBannerProps {
  visible: boolean;
  incomingVersion?: string;
  onUpdate: () => void;
  onLater: () => void;
}

export function UpdateBanner({ visible, incomingVersion, onUpdate, onLater }: UpdateBannerProps) {
  if (!visible) return null;

  return (
    <div className="update-banner" role="status">
      <span>{formatUpdateMessage(incomingVersion)}</span>
      <div className="update-banner-actions">
        <button type="button" className="update-banner-button" onClick={onUpdate}>
          Mettre à jour
        </button>
        <button type="button" className="update-banner-later" onClick={onLater}>
          Plus tard
        </button>
      </div>
    </div>
  );
}
