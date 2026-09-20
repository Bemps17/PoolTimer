import { describe, expect, it } from 'vitest';
import { isAllowedAudioFile, MAX_CUSTOM_SOUND_BYTES } from './customSounds';

describe('isAllowedAudioFile', () => {
  it('accepts common audio types within the size cap', () => {
    expect(isAllowedAudioFile({ type: 'audio/mpeg', size: 12_000, name: 'cri.mp3' })).toBeNull();
    expect(isAllowedAudioFile({ type: '', size: 8_000, name: 'bip.wav' })).toBeNull();
  });

  it('rejects empty, huge, or non-audio files', () => {
    expect(isAllowedAudioFile({ type: 'audio/mpeg', size: 0, name: 'x.mp3' })).toMatch(/lourd/i);
    expect(isAllowedAudioFile({ type: 'audio/mpeg', size: MAX_CUSTOM_SOUND_BYTES + 1, name: 'x.mp3' })).toMatch(/lourd/i);
    expect(isAllowedAudioFile({ type: 'image/png', size: 100, name: 'x.png' })).toMatch(/audio/i);
  });
});
