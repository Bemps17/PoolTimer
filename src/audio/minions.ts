import type { SoundType, TimerConfig } from '../timer/types';
import { clampGain, dbToGain } from '../timer/volume';

export const MINIONS_ARGHH_SRC = '/sound/minions-arghh.mp3';

let minionsAudio: HTMLAudioElement | null = null;

export function shouldPlayMinionsArghh(sound: SoundType, config: TimerConfig): boolean {
  return sound === 'warning' && config.minionsMode && config.sonAlertes;
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
