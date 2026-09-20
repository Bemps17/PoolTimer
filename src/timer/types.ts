export type Theme = 'sombre' | 'light' | 'cyberpunk' | 'ffb' | 'fbep';
export type CompetitionMode = 'ffb' | 'fbep';
export type InterfaceMode = 'boutons' | 'tactile';
export type ShotKind = 'base' | 'apresCasse';
export type PlayerId = 1 | 2;
export type DigitState = 'default' | 'warning' | 'critical';
export type SoundType = 'warning' | 'countdown_tick' | 'gong' | 'click';

export interface TimerConfig {
  tempsBase: number;
  tempsApresCasse: number;
  tempsExtension: number;
  seuilAlerte: number;
  seuilCritique: number;
  volume: number;
  sonAlertes: boolean;
  sonClics: boolean;
  vibration: boolean;
  affichageMs: boolean;
  modeInterface: InterfaceMode;
  tailleChiffres: number;
  autoStartOnReset: boolean;
  autoStartOnPlayerSelect: boolean;
  minionsUnlocked: boolean;
  minionsMode: boolean;
  p1Name: string;
  p1Color: string;
  p2Name: string;
  p2Color: string;
  theme: Theme;
}

export interface AlertsFired {
  warning: boolean;
  lastTickSecond: number;
}

export interface EngineState {
  remainingTime: number;
  isRunning: boolean;
  currentPlayer: PlayerId;
  extensionsUsedInGame: Record<PlayerId, boolean>;
  isExtensionUsedForShot: boolean;
  shotKind: ShotKind;
  expectedTime: number;
  alertsFired: AlertsFired;
}

export type Effect =
  | { type: 'sound'; sound: SoundType }
  | { type: 'vibrate'; pattern: number | number[] }
  | { type: 'scheduleStart'; delayMs: number };

export interface TickResult {
  state: EngineState;
  effects: Effect[];
}
