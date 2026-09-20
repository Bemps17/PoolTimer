import type { SoundType, TimerConfig } from '../timer/types';

export function shouldPlayMinionsArghh(sound: SoundType, config: TimerConfig): boolean {
  return sound === 'warning' && config.minionsMode && config.sonAlertes;
}

export function toggleMinionsMode(config: TimerConfig): TimerConfig {
  if (config.minionsMode) {
    return { ...config, minionsMode: false };
  }
  return {
    ...config,
    minionsUnlocked: true,
    minionsMode: true,
    alertPack: 'minionsLike',
    alertWarningIds: ['minionslike-gazouillis', 'minionslike-wouah'],
    alertPickMode: 'random',
  };
}

export function minionsToggleMessage(enabled: boolean): string {
  return enabled
    ? 'Pack Minions-like (original) activé'
    : 'Pack Minions-like (original) désactivé';
}
