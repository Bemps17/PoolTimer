import * as Tone from 'tone';
import type { SoundType, TimerConfig } from '../timer/types';
import { boostDb, effectiveVolumeDb, LIMITER_THRESHOLD_DB } from './loudness';
import { registerAudioRouter } from './outputRoute';
import { playMinionsArghh, shouldPlayMinionsArghh } from './minions';
import { playAlertById, preloadAlertPack, resolveAlertSoundId } from './playAlert';

interface AudioGraph {
  volumeNode: Tone.Volume;
  boostNode: Tone.Gain;
  limiter: Tone.Limiter;
  sources: WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>;
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
    // iOS : ignorer l'interrupteur silencieux (catégorie « playback »), sinon les alertes peuvent être muettes.
    try {
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
      if (session) session.type = 'playback';
    } catch {
      // non supporté
    }
    // Chaîne maître : volume -> gain (+6 dB en mode maximum) -> limiteur -1 dBFS -> sortie.
    const limiter = new Tone.Limiter(LIMITER_THRESHOLD_DB).toDestination();
    const boostNode = new Tone.Gain(1).connect(limiter);
    const volumeNode = new Tone.Volume(Number.isFinite(volumeDb) ? volumeDb : 0).connect(boostNode);
    const bellSynth = new Tone.MetalSynth({
      resonance: 300,
      harmonicity: 5.1,
      modulationIndex: 16,
      envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
      volume: 0,
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
      // Carré + aigu (1,5 kHz) : bien mieux restitué par un petit haut-parleur qu'un sinus grave.
      oscillator: { type: 'square' },
      volume: -3,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 },
    }).connect(volumeNode);

    const sources = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
    // Un élément routé dépend du contexte audio : le relancer dès qu'il est suspendu (retour d'écran verrouillé, etc.).
    const resume = () => {
      const ctx = Tone.getContext().rawContext as AudioContext;
      if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', resume);
    document.addEventListener('pointerdown', resume, { passive: true });

    graph = { volumeNode, boostNode, limiter, sources, bellSynth, gong, clickSynth, countdownSynth };
    registerAudioRouter((audio) => {
      if (!graph) return false;
      if (graph.sources.has(audio)) return true;
      const source = (Tone.getContext().rawContext as AudioContext).createMediaElementSource(audio);
      Tone.connect(source, graph.volumeNode);
      graph.sources.set(audio, source);
      return true;
    });
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
  applyMasterLevel(config);
  const now = Tone.now();
  switch (id) {
    case 'classic-warning':
      graph.bellSynth.triggerAttack(300, now);
      return;
    case 'classic-tick':
      graph.countdownSynth.triggerAttackRelease('G6', '16n', now);
      return;
    case 'classic-oneshot5s':
      for (let beat = 0; beat < 5; beat += 1) {
        graph.countdownSynth.triggerAttackRelease('G6', '16n', now + beat);
      }
      return;
    case 'classic-gong':
      graph.gong.triggerAttackRelease('A3', '0.5s', now);
      return;
    case 'classic-clic':
      graph.clickSynth.triggerAttackRelease('C4', '32n', now, 0.5);
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
      applyMasterLevel(config);
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

  if (shouldPlayMinionsArghh(type, config)) {
    applyMasterLevel(config);
    playMinionsArghh(effectiveVolumeDb(config));
    return;
  }

  const id = resolveAlertSoundId(type, config);
  if (!id) {
    playClassicType(type, config);
    return;
  }

  applyMasterLevel(config);
  const routed = playAlertById(id, effectiveVolumeDb(config));
  if (routed === 'classic' || routed === 'missing') {
    if (id.startsWith('classic-')) {
      playClassicTone(id, config);
      return;
    }
    playClassicType(type, config);
  }
}

export function previewAlertSound(id: string, config: TimerConfig): void {
  void initializeAudio(effectiveVolumeDb(config)).then(() => {
    if (!config.sonAlertes) return;
    applyMasterLevel(config);
    const routed = playAlertById(id, effectiveVolumeDb(config));
    if (routed === 'classic' || routed === 'missing') {
      playClassicTone(id.startsWith('classic-') ? id : 'classic-warning', config);
    }
  });
}

export function setAudioVolume(volumeDb: number, boost = 0): void {
  if (graph) {
    graph.volumeNode.volume.value = volumeDb;
    graph.boostNode.gain.value = Tone.dbToGain(boost);
  }
}

/** Applique volume + gain d'après la configuration (à chaque lecture : le réglage peut avoir changé). */
function applyMasterLevel(config: TimerConfig): void {
  setAudioVolume(effectiveVolumeDb(config), boostDb(config));
}

/** Pour le hook : le niveau maître suit la configuration. */
export function syncMasterLevel(config: TimerConfig): void {
  applyMasterLevel(config);
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
