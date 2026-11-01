import { describe, expect, it } from 'vitest';
import { isIos, keepAwakeLabel, needsVideoFallback, resolveStatus } from './keepAwake';

const android = { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120', standalone: false };
const iphoneApp = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari', standalone: true };
const iphoneTab = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari', standalone: false };
const ipadDesktopUa = { userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 };

describe('écran toujours allumé', () => {
  it('detects iOS including iPadOS desktop UA', () => {
    expect(isIos(iphoneApp)).toBe(true);
    expect(isIos(ipadDesktopUa)).toBe(true);
    expect(isIos(android)).toBe(false);
    expect(isIos({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
  });

  it('uses the video fallback when the Wake Lock API is missing/refused, or for installed iOS apps', () => {
    expect(needsVideoFallback({ wakeLockGranted: false, env: android })).toBe(true);
    expect(needsVideoFallback({ wakeLockGranted: true, env: android })).toBe(false);
    expect(needsVideoFallback({ wakeLockGranted: true, env: iphoneTab })).toBe(false);
    expect(needsVideoFallback({ wakeLockGranted: true, env: iphoneApp })).toBe(true);
  });

  it('resolves the user-facing status', () => {
    const base = { videoPlaying: false, videoSupported: true };
    expect(resolveStatus({ ...base, active: false, wakeLockGranted: true, env: android })).toBe('off');
    expect(resolveStatus({ ...base, active: true, wakeLockGranted: true, env: android })).toBe('active');
    expect(resolveStatus({ ...base, active: true, wakeLockGranted: false, env: android })).toBe('needs-tap');
    expect(resolveStatus({ ...base, active: true, wakeLockGranted: false, videoPlaying: true, env: android })).toBe('active');
    expect(resolveStatus({ ...base, active: true, wakeLockGranted: false, videoSupported: false, env: android })).toBe('unsupported');
    expect(keepAwakeLabel('needs-tap')).toMatch(/Touchez/);
    expect(keepAwakeLabel('off')).toBe('');
  });
});
