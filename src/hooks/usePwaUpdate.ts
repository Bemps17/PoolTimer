import { useCallback, useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { APP_VERSION } from '../changelog';
import { applyAppUpdate, checkForRemoteUpdate, type UpdateCheckResult } from '../pwa/updatePrompt';
import {
  clearSnoozedVersion,
  loadSnoozedVersion,
  saveSnoozedVersion,
  shouldShowUpdateBanner,
  snoozeToken,
} from '../pwa/updateChoice';

const VERSION_CHECK_MS = 60 * 1000;

export function usePwaUpdate() {
  const [incomingVersion, setIncomingVersion] = useState<string | undefined>(undefined);
  const [snoozedVersion, setSnoozedVersion] = useState<string | null>(() => loadSnoozedVersion());
  const [forceBanner, setForceBanner] = useState(false);
  const pollRef = useRef<number | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration;
      void registration?.update();
    },
  });

  const applyRemoteResult = useCallback((result: UpdateCheckResult) => {
    if (result.status === 'update') {
      setIncomingVersion(result.version);
      return result;
    }
    if (result.status === 'current') {
      setIncomingVersion(undefined);
    }
    return result;
  }, []);

  const checkForUpdate = useCallback(async (): Promise<UpdateCheckResult> => {
    void registrationRef.current?.update();
    const result = await checkForRemoteUpdate(APP_VERSION);
    const applied = applyRemoteResult(result);
    if (applied.status === 'update') {
      setForceBanner(true);
    }
    return applied;
  }, [applyRemoteResult]);

  useEffect(() => {
    void checkForRemoteUpdate(APP_VERSION).then(applyRemoteResult);

    const onVisibleOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void checkForRemoteUpdate(APP_VERSION).then(applyRemoteResult);
    };

    document.addEventListener('visibilitychange', onVisibleOrFocus);
    window.addEventListener('focus', onVisibleOrFocus);
    pollRef.current = window.setInterval(() => {
      void checkForRemoteUpdate(APP_VERSION).then(applyRemoteResult);
    }, VERSION_CHECK_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibleOrFocus);
      window.removeEventListener('focus', onVisibleOrFocus);
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [applyRemoteResult]);

  const applyUpdate = useCallback(() => {
    clearSnoozedVersion();
    void applyAppUpdate({ updateServiceWorker });
  }, [updateServiceWorker]);

  const snoozeUpdate = useCallback(() => {
    const token = snoozeToken(incomingVersion);
    saveSnoozedVersion(token);
    setSnoozedVersion(token);
    setForceBanner(false);
  }, [incomingVersion]);

  const updateAvailable = needRefresh || Boolean(incomingVersion);
  const bannerVisible = shouldShowUpdateBanner({
    updateAvailable,
    incomingVersion,
    snoozedVersion,
    forceShow: forceBanner,
  });

  return {
    needRefresh,
    incomingVersion,
    updateAvailable,
    bannerVisible,
    snoozed: Boolean(snoozedVersion) && snoozedVersion === snoozeToken(incomingVersion),
    applyUpdate,
    snoozeUpdate,
    checkForUpdate,
  };
}
