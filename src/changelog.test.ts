import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_VERSION, CHANGELOG } from './changelog';

describe('changelog', () => {
  it('keeps the UI version aligned with package.json and the latest notes', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    const published = JSON.parse(readFileSync(new URL('../public/version.json', import.meta.url), 'utf8')) as {
      version: string;
    };
    expect(APP_VERSION).toBe(pkg.version);
    expect(published.version).toBe(APP_VERSION);
    expect(CHANGELOG[0]?.version).toBe(APP_VERSION);
    expect(CHANGELOG[0]?.notes.length).toBeGreaterThan(0);
  });
});
