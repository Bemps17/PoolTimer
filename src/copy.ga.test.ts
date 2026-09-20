import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('GA copy', () => {
  it('does not label the live mirror UI as beta / WIP', () => {
    const files = [
      'src/components/MirrorSettings.tsx',
      'src/components/MirrorGuide.tsx',
      'src/components/HelpPanel.tsx',
      'src/components/DisplayView.tsx',
      'src/App.tsx',
      'src/mirror/syncStatus.ts',
    ];
    for (const file of files) {
      const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
      expect(text, file).not.toMatch(/Work in progress/i);
      expect(text, file).not.toMatch(/Bêta/);
      expect(text, file).not.toMatch(/bêta/);
    }
  });
});
