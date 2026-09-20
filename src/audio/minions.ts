import type { SoundType, TimerConfig } from '../timer/types';
import { clampGain, dbToGain } from '../timer/volume';

/** Vendored in-repo since 247d3db (hidden Minions easter egg). */
export const MINIONS_ARGHH_SRC = '/sound/minions-arghh.mp3';
export const MINIONS_ARGHH_ID = 'minions-arghh';

let minionsAudio: HTMLAudioElement | null = null;

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
  if (!minionsAudio) {
    minionsAudio = new Audio(MINIONS_ARGHH_SRC);
    minionsAudio.preload = 'auto';
  }
}

export function playMinionsArghh(volumeDb: number): void {
  preloadMinionsArghh();
  if (!minionsAudio) return;
  minionsAudio.volume = clampGain(dbToGain(Number.isFinite(volumeDb) ? volumeDb : -10));
  minionsAudio.currentTime = 0;
  void minionsAudio.play().catch(() => {
    // Playback can be blocked until a user gesture; ignore.
  });
}
