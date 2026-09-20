import { describe, expect, it } from 'vitest';
import { getPwaInstallStatus, installButtonCopy } from './installStatus';

describe('getPwaInstallStatus', () => {
  it('detects an already installed PWA', () => {
    expect(
      getPwaInstallStatus({ standalone: true, hasDeferredPrompt: false, userAgent: 'Mozilla/5.0' }),
    ).toBe('installed');
  });

  it('enables install when the browser deferred a prompt', () => {
    expect(
      getPwaInstallStatus({ standalone: false, hasDeferredPrompt: true, userAgent: 'Chrome' }),
    ).toBe('available');
  });

  it('shows the iOS share hint when Safari has no install prompt', () => {
    expect(
      getPwaInstallStatus({
        standalone: false,
        hasDeferredPrompt: false,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      }),
    ).toBe('ios');
    expect(installButtonCopy('ios').disabled).toBe(true);
    expect(installButtonCopy('ios').hint).toMatch(/Partager/);
  });
});
