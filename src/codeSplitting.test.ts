import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const staticImports = (code: string) => [...code.matchAll(/^import\s+[^;]*?from\s+'([^']+)'/gm)].map((m) => m[1]!);

describe('découpage du code (écran Visuel et overlay OBS légers)', () => {
  it('the router loads each view lazily', () => {
    const app = source('./App.tsx');
    expect(app).toMatch(/lazy\(\s*\(\)\s*=>\s*import\('\.\/ControllerApp'\)/);
    expect(app).toMatch(/lazy\(\s*\(\)\s*=>\s*import\('\.\/components\/DisplayView'\)/);
    expect(app).toMatch(/lazy\(\s*\(\)\s*=>\s*import\('\.\/components\/OverlayView'\)/);
    expect(app).toContain('<Suspense');
  });

  it('the router itself never pulls the controller, settings or the audio engine', () => {
    const imports = staticImports(source('./App.tsx'));
    for (const heavy of ['tone', './audio/toneAudio', './components/Scoreboard', './components/SettingsPanel', './ControllerApp']) {
      expect(imports, heavy).not.toContain(heavy);
    }
  });

  it('the Visual screen and the overlay do not import the audio engine', () => {
    for (const file of ['./components/DisplayView.tsx', './components/OverlayView.tsx', './hooks/useMirror.ts']) {
      const imports = staticImports(source(file));
      expect(imports.some((path) => path.includes('toneAudio') || path === 'tone'), file).toBe(false);
    }
  });
});
