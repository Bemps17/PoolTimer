import * as Tone from 'tone';
import type { SoundType, TimerConfig } from '../timer/types';
import { playAlertById, preloadAlertPack, resolveAlertSoundId } from './playAlert';

interface AudioGraph {
  volumeNode: Tone.Volume;
  bellSynth: Tone.MetalSynth;
  gong: Tone.FMSynth;
  clickSynth: Tone.MembraneSynth;
  countdownSynth: Tone.Synth;
}

let graph: AudioGraph | null = null;
let initializing: Promise<void> | null = null;

export async function initializeAudio(volumeDb: number): Promise<void> {
  if (graph) return;
  if (initializing) {
    await initializing;
    return;
  }

  initializing = (async () => {
    await Tone.start();
    const volumeNode = new Tone.Volume(Number.isFinite(volumeDb) ? volumeDb : -10).toDestination();
    const bellSynth = new Tone.MetalSynth({
      resonance: 300,
      harmonicity: 5.1,
      modulationIndex: 16,
      envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
      volume: -10,
    }).connect(volumeNode);
    const gong = new Tone.FMSynth({
      harmonicity: 3.1,
      modulationIndex: 20,
      envelope: { attack: 0.01, decay: 0.2, release: 0.5 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.01, decay: 0.5, release: 0.5 },
    }).connect(volumeNode);
    const clickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 1,
      envelope: { attack: 0.001, decay: 0.1, sustain: 0 },
    }).connect(volumeNode);
    const countdownSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      volume: -5,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 },
    }).connect(volumeNode);

    graph = { volumeNode, bellSynth, gong, clickSynth, countdownSynth };
  })();

  try {
    await initializing;
  } catch (error) {
    console.error('Could not start audio context.', error);
    graph = null;
  } finally {
    initializing = null;
  }
}

function playClassicTone(id: string, config: TimerConfig): void {
  if (!graph) return;
  graph.volumeNode.volume.value = config.volume;
  const now = Tone.now();
  switch (id) {
    case 'classic-warning':
      graph.bellSynth.triggerAttack(300, now);
      return;
    case 'classic-tick':
      graph.countdownSynth.triggerAttackRelease('G5', '16n', now);
      return;
    case 'classic-oneshot5s':
      for (let beat = 0; beat < 5; beat += 1) {
        graph.countdownSynth.triggerAttackRelease('G5', '16n', now + beat);
      }
      return;
    case 'classic-gong':
      graph.gong.triggerAttackRelease('A3', '0.5s', now);
      return;
    default:
      return;
  }
}

function playClassicType(type: SoundType, config: TimerConfig): void {
  switch (type) {
    case 'warning':
      playClassicTone('classic-warning', config);
      return;
    case 'countdown_tick':
      playClassicTone('classic-tick', config);
      return;
    case 'critical_oneshot':
      playClassicTone('classic-oneshot5s', config);
      return;
    case 'gong':
      playClassicTone('classic-gong', config);
      return;
    case 'click':
      if (!graph) return;
      graph.volumeNode.volume.value = config.volume;
      graph.clickSynth.triggerAttackRelease('C4', '32n', Tone.now(), 0.5);
      return;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

export function playSound(type: SoundType, config: TimerConfig): void {
  const isAlertType =
    type === 'warning' || type === 'countdown_tick' || type === 'gong' || type === 'critical_oneshot';
  const isClickType = type === 'click';
  if ((isAlertType && !config.sonAlertes) || (isClickType && !config.sonClics)) {
    return;
  }

  if (isClickType) {
    playClassicType('click', config);
    return;
  }

  const id = resolveAlertSoundId(type, config);
  if (!id) {
    playClassicType(type, config);
    return;
  }

  const routed = playAlertById(id, config.volume);
  if (routed === 'classic' || routed === 'missing') {
    if (id.startsWith('classic-')) {
      playClassicTone(id, config);
      return;
    }
    playClassicType(type, config);
  }
}

export function previewAlertSound(id: string, config: TimerConfig): void {
  void initializeAudio(config.volume).then(() => {
    if (!config.sonAlertes) return;
    const routed = playAlertById(id, config.volume);
    if (routed === 'classic' || routed === 'missing') {
      playClassicTone(id.startsWith('classic-') ? id : 'classic-warning', config);
    }
  });
}

export function setAudioVolume(volumeDb: number): void {
  if (graph) {
    graph.volumeNode.volume.value = volumeDb;
  }
}

export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (!enabled || !('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.warn('Vibration failed.', error);
  }
}

export { preloadAlertPack };
