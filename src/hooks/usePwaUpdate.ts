import { useCallback, useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { fetchRemoteVersion } from '../pwa/updatePrompt';

const UPDATE_CHECK_MS = 5 * 60 * 1000;

export function usePwaUpdate() {
  const [incomingVersion, setIncomingVersion] = useState<string | undefined>(undefined);
  const pollRef = useRef<number | null>(null);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration || pollRef.current !== null) return;
      pollRef.current = window.setInterval(() => {
        void registration.update();
      }, UPDATE_CHECK_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!needRefresh) {
      setIncomingVersion(undefined);
      return undefined;
    }
    let cancelled = false;
    void fetchRemoteVersion().then((version) => {
      if (!cancelled) setIncomingVersion(version);
    });
    return () => {
      cancelled = true;
    };
  }, [needRefresh]);

  const applyUpdate = useCallback(() => {
    void updateServiceWorker(true);
  }, [updateServiceWorker]);

  return {
    needRefresh,
    incomingVersion,
    applyUpdate,
  };
}
