import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const path = new URL('../.github/workflows/ci.yml', import.meta.url);

describe('intégration continue (GitHub Actions)', () => {
  it('exists, so every push is checked automatically', () => {
    expect(existsSync(path)).toBe(true);
  });

  it('installs from the lockfile, typechecks, tests and builds', () => {
    const yml = readFileSync(path, 'utf8');
    expect(yml).toMatch(/on:\s*[\s\S]*push:/);
    expect(yml).toMatch(/pull_request:/);
    expect(yml).toContain('npm ci');
    expect(yml).toContain('npx tsc -b');
    expect(yml).toContain('npm test');
    expect(yml).toContain('npm run build');
  });

  it('probes the relay (limits, origins, flood) against a local Worker', () => {
    const yml = readFileSync(path, 'utf8');
    expect(yml).toContain('npm run test:mirror');
  });

  it('never grants more than read access to the repository', () => {
    const yml = readFileSync(path, 'utf8');
    expect(yml).toMatch(/permissions:\s*\n\s*contents:\s*read/);
    expect(yml).not.toMatch(/secrets\./);
  });
});
