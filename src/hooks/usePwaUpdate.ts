import { useCallback, useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { APP_VERSION } from '../changelog';
import { applyAppUpdate, checkForRemoteUpdate, type UpdateCheckResult } from '../pwa/updatePrompt';

const VERSION_CHECK_MS = 60 * 1000;

export function usePwaUpdate() {
  const [incomingVersion, setIncomingVersion] = useState<string | undefined>(undefined);
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
    return applyRemoteResult(result);
  }, [applyRemoteResult]);

  useEffect(() => {
    void checkForUpdate();

    const onVisibleOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void checkForUpdate();
    };

    document.addEventListener('visibilitychange', onVisibleOrFocus);
    window.addEventListener('focus', onVisibleOrFocus);
    pollRef.current = window.setInterval(() => {
      void checkForUpdate();
    }, VERSION_CHECK_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibleOrFocus);
      window.removeEventListener('focus', onVisibleOrFocus);
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [checkForUpdate]);

  const applyUpdate = useCallback(() => {
    void applyAppUpdate({ updateServiceWorker });
  }, [updateServiceWorker]);

  return {
    needRefresh,
    incomingVersion,
    updateAvailable: needRefresh || Boolean(incomingVersion),
    applyUpdate,
    checkForUpdate,
  };
}
