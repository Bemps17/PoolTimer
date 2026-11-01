import { useCallback, useEffect, useRef, useState } from 'react';
import { needsVideoFallback, resolveStatus, type KeepAwakeEnv, type KeepAwakeStatus } from '../pwa/keepAwake';

function readEnv(): KeepAwakeEnv {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone:
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches),
  };
}

function makeVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('aria-hidden', 'true');
  video.muted = true;
  video.loop = true;
  video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0.01;pointer-events:none;left:0;top:0;';
  for (const [src, type] of [
    ['/keepawake.mp4', 'video/mp4'],
    ['/keepawake.webm', 'video/webm'],
  ] as const) {
    const source = document.createElement('source');
    source.src = src;
    source.type = type;
    video.appendChild(source);
  }
  document.body.appendChild(video);
  return video;
}

/**
 * Garde l'écran allumé tant que `active` est vrai : Wake Lock API, puis repli vidéo (au prochain appui).
 * Renvoie un statut à afficher à l'utilisateur.
 */
export function useKeepAwake(active: boolean): KeepAwakeStatus {
  const [status, setStatus] = useState<KeepAwakeStatus>('off');
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const grantedRef = useRef(false);
  const playingRef = useRef(false);

  const refresh = useCallback(
    (isActive: boolean) => {
      setStatus(
        resolveStatus({
          active: isActive,
          wakeLockGranted: grantedRef.current,
          videoPlaying: playingRef.current,
          videoSupported: typeof document !== 'undefined' && typeof document.createElement('video').play === 'function',
          env: readEnv(),
        }),
      );
    },
    [],
  );

  useEffect(() => {
    if (!active) {
      grantedRef.current = false;
      playingRef.current = false;
      setStatus('off');
      return undefined;
    }

    let cancelled = false;
    const env = readEnv();

    const requestLock = async () => {
      if (!('wakeLock' in navigator)) {
        grantedRef.current = false;
        refresh(true);
        return;
      }
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void lock.release().catch(() => undefined);
          return;
        }
        sentinelRef.current = lock;
        grantedRef.current = true;
        lock.addEventListener('release', () => {
          grantedRef.current = false;
          refresh(true);
        });
      } catch {
        grantedRef.current = false;
      }
      refresh(true);
    };

    const startVideo = () => {
      if (cancelled || playingRef.current) return;
      if (!needsVideoFallback({ wakeLockGranted: grantedRef.current, env })) return;
      try {
        const video = videoRef.current ?? makeVideo();
        videoRef.current = video;
        void video
          .play()
          .then(() => {
            playingRef.current = true;
            refresh(true);
          })
          .catch(() => undefined);
      } catch {
        // pas de lecture vidéo possible
      }
    };

    const onGesture = () => {
      // Le geste permet la vidéo ET de redemander le verrou s'il a été perdu.
      if (!grantedRef.current) void requestLock();
      startVideo();
    };

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      playingRef.current = Boolean(videoRef.current && !videoRef.current.paused);
      void requestLock();
      startVideo();
    };

    void requestLock();
    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('pointerdown', onGesture, { passive: true });
    document.addEventListener('touchend', onGesture, { passive: true });

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('pointerdown', onGesture);
      document.removeEventListener('touchend', onGesture);
      void sentinelRef.current?.release().catch(() => undefined);
      sentinelRef.current = null;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.remove();
        videoRef.current = null;
      }
      grantedRef.current = false;
      playingRef.current = false;
    };
  }, [active, refresh]);

  return status;
}
