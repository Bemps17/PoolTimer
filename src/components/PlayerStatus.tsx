import { FitText } from './FitText';

interface PlayerStatusProps {
  name: string;
  color: string;
  active: boolean;
  extensionUsed: boolean;
  onSelect?: () => void;
}

export function PlayerStatus({ name, color, active, extensionUsed, onSelect }: PlayerStatusProps) {
  const interactive = Boolean(onSelect);

  return (
    <div
      className={`player-status${active ? ' active' : ''}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      style={
        active
          ? { borderColor: color, boxShadow: `0 0 10px ${color}80` }
          : { borderColor: 'transparent', boxShadow: 'none' }
      }
    >
      <FitText className="player-name">{name}</FitText>
      <span className={`ext-status ${extensionUsed ? 'ext-used' : 'ext-available'}`}>EXT</span>
    </div>
  );
}
