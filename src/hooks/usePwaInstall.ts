import { useCallback, useEffect, useState } from 'react';
import {
  getPwaInstallStatus,
  isStandaloneDisplay,
  type PwaInstallStatus,
} from '../pwa/installStatus';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function readStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return isStandaloneDisplay({ displayModeStandalone, iosStandalone });
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(readStandalone);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setStandalone(true);
    };
    const media = window.matchMedia('(display-mode: standalone)');
    const onDisplayMode = () => setStandalone(readStandalone());

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    media.addEventListener('change', onDisplayMode);
    setStandalone(readStandalone());

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      media.removeEventListener('change', onDisplayMode);
    };
  }, []);

  const status: PwaInstallStatus = getPwaInstallStatus({
    standalone,
    hasDeferredPrompt: deferredPrompt !== null,
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
  });

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return { status, install };
}
