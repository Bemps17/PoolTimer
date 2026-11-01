import type { SoundType, TimerConfig } from '../timer/types';
import { clampGain, dbToGain } from '../timer/volume';
import { createElementPool } from './outputRoute';

/** Vendored in-repo since 247d3db (hidden Minions easter egg). */
export const MINIONS_ARGHH_SRC = '/sound/minions-arghh.mp3';
export const MINIONS_ARGHH_ID = 'minions-arghh';

const minionsPool = createElementPool((src) => {
  const audio = new Audio(src);
  audio.preload = 'auto';
  return audio;
});

export function shouldPlayMinionsArghh(sound: SoundType, config: TimerConfig): boolean {
  return sound === 'warning' && config.minionsMode && config.sonAlertes;
}

export function toggleMinionsMode(config: TimerConfig): TimerConfig {
  if (config.minionsMode) {
    return { ...config, minionsMode: false };
  }
  return { ...config, minionsUnlocked: true, minionsMode: true };
}

export function minionsToggleMessage(enabled: boolean): string {
  return enabled ? 'Mode Minions activé' : 'Mode Minions désactivé';
}

export function preloadMinionsArghh(): void {
  if (typeof Audio === 'undefined') return;
  minionsPool.acquire(MINIONS_ARGHH_SRC);
}

export function playMinionsArghh(volumeDb: number): void {
  if (typeof Audio === 'undefined') return;
  const { audio, routed } = minionsPool.acquire(MINIONS_ARGHH_SRC);
  audio.volume = routed ? 1 : clampGain(dbToGain(Number.isFinite(volumeDb) ? volumeDb : 0));
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Playback can be blocked until a user gesture; ignore.
  });
}
