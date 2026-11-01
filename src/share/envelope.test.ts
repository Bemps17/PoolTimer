import { describe, expect, it } from 'vitest';
import { colorsForTheme } from '../timer/theme';
import {
  buildShareUrl,
  decodeShareText,
  encodeEnvelope,
  envelopeToFileText,
  MAX_FILE_BYTES,
  MAX_PAYLOAD_CHARS,
  parseEnvelope,
  readShareFile,
  shareFileName,
  type ShareEnvelope,
} from './envelope';

const preset: ShareEnvelope = {
  kind: 'preset',
  preset: { name: 'Ligue du jeudi é', tempsBase: 40, tempsApresCasse: 80, tempsExtension: 20, seuilAlerte: 12, seuilCritique: 4, raceTo: 5 },
};
const bundle: ShareEnvelope = {
  kind: 'bundle',
  preset: preset.preset,
  theme: { name: 'Néon', base: 'cyberpunk', colors: colorsForTheme('cyberpunk') },
};

describe('partage : enveloppe versionnée', () => {
  it('round-trips a preset through link, bare code and file', () => {
    const url = buildShareUrl('https://pooltimer.vercel.app/', preset);
    expect(url.startsWith('https://pooltimer.vercel.app/#h8=')).toBe(true);
    for (const text of [url, encodeEnvelope(preset), `h8=${encodeEnvelope(preset)}`, envelopeToFileText(preset)]) {
      const result = decodeShareText(text);
      expect(result.ok && result.envelope).toEqual(preset);
    }
  });

  it('round-trips a bundle with a theme, keeping accents', () => {
    const result = decodeShareText(buildShareUrl('https://x.test', bundle));
    expect(result.ok && result.envelope.theme?.colors).toEqual(colorsForTheme('cyberpunk'));
    expect(result.ok && result.envelope.preset?.name).toBe('Ligue du jeudi é');
  });

  it('only ships colors that differ from the base theme (short links), and restores them on import', () => {
    const custom: ShareEnvelope = {
      kind: 'theme',
      theme: { name: 'Club', base: 'ffb', colors: { ...colorsForTheme('ffb'), primary: '#12ab34' } },
    };
    const plain = encodeEnvelope({ kind: 'theme', theme: { name: 'Club', base: 'ffb', colors: colorsForTheme('ffb') } });
    expect(encodeEnvelope(custom).length).toBeLessThan(plain.length + 60);
    expect(plain.length).toBeLessThan(200);
    const back = decodeShareText(encodeEnvelope(custom));
    expect(back.ok && back.envelope.theme?.colors).toEqual(custom.theme!.colors);
  });

  it('rejects wrong versions, kinds and incomplete bundles with a clear message', () => {
    expect(parseEnvelope({ h8: 2, kind: 'preset' })).toMatchObject({ ok: false, error: expect.stringMatching(/plus récente/) });
    expect(parseEnvelope({ h8: 0 })).toMatchObject({ ok: false });
    expect(parseEnvelope({ h8: 1, kind: 'virus' })).toMatchObject({ ok: false });
    expect(parseEnvelope({ h8: 1, kind: 'bundle', preset: {} })).toMatchObject({ ok: false });
    expect(parseEnvelope(null)).toMatchObject({ ok: false });
    expect(parseEnvelope([])).toMatchObject({ ok: false });
  });

  it('clamps hostile values and drops unknown keys', () => {
    const result = parseEnvelope({
      h8: 1,
      kind: 'bundle',
      evil: '<script>',
      __proto__: { polluted: true },
      preset: { name: '<img onerror=1>'.repeat(10), tempsBase: 99999, tempsApresCasse: -4, tempsExtension: 'x', seuilAlerte: 5, seuilCritique: 99, raceTo: 1e9, extra: 1 },
      theme: { name: 'T', base: 'hacker', colors: { background: 'javascript:alert(1)', primary: '#12ab34' } },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const p = result.envelope.preset!;
    expect(p.tempsBase).toBe(180);
    expect(p.tempsApresCasse).toBe(10);
    expect(p.seuilCritique).toBeLessThanOrEqual(p.seuilAlerte);
    expect(p.raceTo).toBe(500);
    expect(p.name).not.toMatch(/[<>]/);
    expect(p).not.toHaveProperty('extra');
    expect(result.envelope.theme!.base).toBe('sombre');
    expect(result.envelope.theme!.colors.background).toBe(colorsForTheme('sombre').background);
    expect(result.envelope.theme!.colors.primary.toLowerCase()).toBe('#12ab34');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('survives garbage text, truncated codes and oversize input', () => {
    expect(decodeShareText('')).toMatchObject({ ok: false });
    expect(decodeShareText('n’importe quoi !!')).toMatchObject({ ok: false });
    expect(decodeShareText('{oops')).toMatchObject({ ok: false });
    expect(decodeShareText(encodeEnvelope(preset).slice(0, 25))).toMatchObject({ ok: false });
    expect(decodeShareText('A'.repeat(MAX_PAYLOAD_CHARS + 1))).toMatchObject({ ok: false, error: expect.stringMatching(/volumineux/) });
    expect(decodeShareText('%%%#h8=@@@')).toMatchObject({ ok: false });
  });

  it('bounds file size and builds a safe file name', async () => {
    expect(await readShareFile({ size: MAX_FILE_BYTES + 1, text: async () => '{}' })).toMatchObject({ ok: false });
    const text = envelopeToFileText(preset);
    expect(await readShareFile({ size: text.length, text: async () => text })).toMatchObject({ ok: true });
    expect(shareFileName(preset)).toBe('ligue-du-jeudi-e.h8preset.json');
    expect(shareFileName({ kind: 'theme' })).toBe('h8timer.h8preset.json');
  });
});
