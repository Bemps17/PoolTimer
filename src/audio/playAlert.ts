import type { SoundType, TimerConfig } from '../timer/types';
import { clampGain, dbToGain } from '../timer/volume';
import { MINIONS_ARGHH_ID, MINIONS_ARGHH_SRC, shouldPlayMinionsArghh } from './minions';
import { catalogById, isCustomSoundId, pickAlertSound } from './soundCatalog';
import { getCustomSound } from './customSounds';

/** Original PoolTimer files (743bee7 / c1ecd0a), still in public/sound/. */
export const CLASSIC_ALERT_TIME_SRC = '/sound/alert-time.mp3';
export const CLASSIC_CLIC_SRC = '/sound/clic.mp3';

const fileAudio = new Map<string, HTMLAudioElement>();
const objectUrls = new Map<string, string>();
let customAudio: HTMLAudioElement | null = null;

export function resolveAlertSoundId(type: SoundType, config: TimerConfig, random?: () => number): string | undefined {
  switch (type) {
    case 'warning':
      if (shouldPlayMinionsArghh(type, config)) {
        return MINIONS_ARGHH_ID;
      }
      return pickAlertSound(config.alertWarningIds, config.alertPickMode, random);
    case 'countdown_tick':
      return pickAlertSound(config.alertCriticalIds, config.alertPickMode, random);
    case 'critical_oneshot':
      return pickAlertSound(config.alertCriticalIds, config.alertPickMode, random);
    case 'gong':
      return pickAlertSound(config.alertEndIds, config.alertPickMode, random);
    case 'click':
      return 'classic-clic';
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

function setVolume(audio: HTMLAudioElement, volumeDb: number): void {
  audio.volume = clampGain(dbToGain(Number.isFinite(volumeDb) ? volumeDb : -10));
}

export function playSoundSrc(src: string, volumeDb: number): void {
  if (typeof Audio === 'undefined') return;
  let audio = fileAudio.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = 'auto';
    fileAudio.set(src, audio);
  }
  setVolume(audio, volumeDb);
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Playback can be blocked until a user gesture.
  });
}

function preloadSrc(src: string): void {
  if (typeof Audio === 'undefined' || fileAudio.has(src)) return;
  const audio = new Audio(src);
  audio.preload = 'auto';
  fileAudio.set(src, audio);
}

async function playCustom(id: string, volumeDb: number): Promise<void> {
  if (typeof Audio === 'undefined') return;
  const record = await getCustomSound(id);
  if (!record) return;
  let url = objectUrls.get(id);
  if (!url) {
    url = URL.createObjectURL(record.blob);
    objectUrls.set(id, url);
  }
  if (!customAudio) customAudio = new Audio();
  customAudio.src = url;
  setVolume(customAudio, volumeDb);
  customAudio.currentTime = 0;
  void customAudio.play().catch(() => {
    // ignore autoplay failures
  });
}

export function playAlertById(id: string, volumeDb: number): 'file' | 'classic' | 'custom' | 'missing' {
  if (isCustomSoundId(id)) {
    void playCustom(id, volumeDb);
    return 'custom';
  }
  const entry = catalogById(id);
  if (!entry) return 'missing';
  if (entry.src) {
    playSoundSrc(entry.src, volumeDb);
    return 'file';
  }
  return 'classic';
}

export function preloadAlertPack(config: TimerConfig): void {
  if (typeof Audio === 'undefined') return;
  preloadSrc(CLASSIC_ALERT_TIME_SRC);
  preloadSrc(CLASSIC_CLIC_SRC);
  preloadSrc(MINIONS_ARGHH_SRC);
  const ids = [...config.alertWarningIds, ...config.alertCriticalIds, ...config.alertEndIds];
  for (const id of ids) {
    const entry = catalogById(id);
    if (entry?.src) preloadSrc(entry.src);
  }
}
