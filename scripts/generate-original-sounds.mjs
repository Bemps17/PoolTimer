#!/usr/bin/env node
/**
 * Original H8timer alert samples — synthesized PCM, not sampled from any franchise.
 * Pack labels are "Crétins (original)" / "Minions-like (original)" and are not
 * affiliated with Ubisoft, Illumination, or Universal.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22050;
const outDir = join(dirname(fileURLToPath(import.meta.url)), '../public/sound/original');

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function synth(durationSec, fn) {
  const n = Math.floor(durationSec * SAMPLE_RATE);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const t = i / SAMPLE_RATE;
    samples[i] = clamp(fn(t, i, n), -1, 1);
  }
  return samples;
}

function env(t, attack, decay, dur) {
  if (t < 0) return 0;
  if (t < attack) return t / attack;
  if (t > dur) return 0;
  const rest = dur - attack;
  if (rest <= 0) return 0;
  return Math.exp(-((t - attack) / Math.max(0.02, decay)));
}

function fm(t, carrier, modHz, index) {
  return Math.sin(2 * Math.PI * carrier * t + index * Math.sin(2 * Math.PI * modHz * t));
}

function noise(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function writeWav(name, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const s = clamp(samples[i], -1, 1);
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  writeFileSync(join(outDir, name), buffer);
}

function mixAt(target, offsetSec, chunk, gain = 1) {
  const start = Math.floor(offsetSec * SAMPLE_RATE);
  for (let i = 0; i < chunk.length && start + i < target.length; i += 1) {
    target[start + i] = clamp(target[start + i] + chunk[i] * gain, -1, 1);
  }
}

mkdirSync(outDir, { recursive: true });

writeWav(
  'cretins-couac.wav',
  synth(0.42, (t) => {
    const freq = 620 - t * 880;
    return fm(t, freq, 42, 8) * env(t, 0.008, 0.12, 0.4) * 0.7 + noise(Math.floor(t * 8000)) * 0.08 * env(t, 0.004, 0.05, 0.2);
  }),
);

writeWav(
  'cretins-glousse.wav',
  synth(0.58, (t) => {
    const hop = Math.floor(t * 9);
    const freq = 740 + hop * 90 + Math.sin(t * 40) * 60;
    return fm(t, freq, 18 + hop * 3, 4.5) * env(t % 0.11, 0.004, 0.05, 0.1) * 0.65;
  }),
);

writeWav(
  'cretins-tick.wav',
  synth(0.16, (t) => Math.sin(2 * Math.PI * (880 + t * 200) * t) * env(t, 0.002, 0.04, 0.15) * 0.75),
);

{
  const long = new Float32Array(Math.floor(5 * SAMPLE_RATE));
  for (let s = 0; s < 5; s += 1) {
    const blip = synth(0.28, (t) => {
      const freq = 500 + s * 70 + Math.sin(t * 30) * 40;
      return fm(t, freq, 55, 6) * env(t, 0.01, 0.08, 0.26) * 0.6;
    });
    mixAt(long, s, blip);
  }
  writeWav('cretins-alerte5s.wav', long);
}

writeWav(
  'cretins-fin.wav',
  synth(0.72, (t) => {
    const freq = 180 + t * 40;
    return (fm(t, freq, 9, 12) + Math.sin(2 * Math.PI * 90 * t) * 0.4) * env(t, 0.02, 0.28, 0.7) * 0.7;
  }),
);

writeWav(
  'minionslike-gazouillis.wav',
  synth(0.52, (t) => {
    const syllable = Math.floor(t / 0.09);
    const base = 420 + syllable * 55;
    const vib = Math.sin(2 * Math.PI * 7 * t) * 18;
    return Math.sin(2 * Math.PI * (base + vib) * t) * env(t % 0.09, 0.01, 0.04, 0.085) * 0.7;
  }),
);

writeWav(
  'minionslike-wouah.wav',
  synth(0.48, (t) => {
    const freq = 360 + 420 * Math.sin(Math.min(1, t / 0.22) * Math.PI);
    return Math.sin(2 * Math.PI * freq * t) * env(t, 0.02, 0.16, 0.46) * 0.72;
  }),
);

writeWav(
  'minionslike-tick.wav',
  synth(0.14, (t) => Math.sin(2 * Math.PI * 980 * t) * env(t, 0.003, 0.03, 0.13) * 0.7),
);

{
  const long = new Float32Array(Math.floor(5 * SAMPLE_RATE));
  for (let s = 0; s < 5; s += 1) {
    const chirp = synth(0.32, (t) => {
      const freq = 380 + s * 40 + t * 220;
      return Math.sin(2 * Math.PI * freq * t) * env(t, 0.015, 0.1, 0.3) * 0.62;
    });
    mixAt(long, s, chirp);
  }
  writeWav('minionslike-alerte5s.wav', long);
}

writeWav(
  'minionslike-fin.wav',
  synth(0.78, (t) => {
    const freq = 240 - t * 80;
    return (Math.sin(2 * Math.PI * freq * t) + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.35) * env(t, 0.02, 0.3, 0.76) * 0.7;
  }),
);

console.log(`Wrote original H8timer packs to ${outDir}`);
