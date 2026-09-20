import { FitText } from './FitText';
import { displayPlayerName } from '../timer/playerName';

interface PlayerStatusProps {
  name: string;
  color: string;
  active: boolean;
  extensionUsed: boolean;
  seat: 1 | 2;
  onSelect?: () => void;
}

export function PlayerStatus({ name, color, active, extensionUsed, seat, onSelect }: PlayerStatusProps) {
  const interactive = Boolean(onSelect);
  const shown = displayPlayerName(name, seat);

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
      <FitText className="player-name">{shown}</FitText>
      <span className={`ext-status ${extensionUsed ? 'ext-used' : 'ext-available'}`}>EXT</span>
    </div>
  );
}
