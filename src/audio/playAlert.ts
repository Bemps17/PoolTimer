import type { SoundType, TimerConfig } from '../timer/types';
import { clampGain, dbToGain } from '../timer/volume';
import { catalogById, isCustomSoundId, pickAlertSound } from './soundCatalog';
import { getCustomSound } from './customSounds';

const fileAudio = new Map<string, HTMLAudioElement>();
const objectUrls = new Map<string, string>();
let customAudio: HTMLAudioElement | null = null;

export function resolveAlertSoundId(type: SoundType, config: TimerConfig, random?: () => number): string | undefined {
  switch (type) {
    case 'warning':
      if (config.minionsMode) {
        return pickAlertSound(['minionslike-gazouillis', 'minionslike-wouah'], 'random', random);
      }
      return pickAlertSound(config.alertWarningIds, config.alertPickMode, random);
    case 'countdown_tick':
      return pickAlertSound(config.alertCriticalIds, config.alertPickMode, random);
    case 'critical_oneshot':
      return pickAlertSound(config.alertCriticalIds, config.alertPickMode, random);
    case 'gong':
      return pickAlertSound(config.alertEndIds, config.alertPickMode, random);
    case 'click':
      return undefined;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

function setVolume(audio: HTMLAudioElement, volumeDb: number): void {
  audio.volume = clampGain(dbToGain(Number.isFinite(volumeDb) ? volumeDb : -10));
}

function playSrc(src: string, volumeDb: number): void {
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
    playSrc(entry.src, volumeDb);
    return 'file';
  }
  return 'classic';
}

export function preloadAlertPack(config: TimerConfig): void {
  if (typeof Audio === 'undefined') return;
  const ids = [...config.alertWarningIds, ...config.alertCriticalIds, ...config.alertEndIds];
  for (const id of ids) {
    const entry = catalogById(id);
    if (entry?.src && !fileAudio.has(entry.src)) {
      const audio = new Audio(entry.src);
      audio.preload = 'auto';
      fileAudio.set(entry.src, audio);
    }
  }
}
