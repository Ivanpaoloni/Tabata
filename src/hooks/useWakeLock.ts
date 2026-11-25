import { useEffect, useRef } from 'react';

export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let cancelled = false;

    const acquire = async () => {
      if (!active || cancelled) return;
      try {
        if (sentinelRef.current && !sentinelRef.current.released) return;
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          await sentinel.release().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
      } catch {
        // Silently ignore unsupported or denied wake lock requests
      }
    };

    const release = async () => {
      if (sentinelRef.current) {
        const s = sentinelRef.current;
        sentinelRef.current = null;
        try {
          if (!s.released) await s.release();
        } catch {
          // Ignore release errors
        }
      }
    };

    if (active) {
      void acquire();
    } else {
      void release();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        void acquire();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void release();
    };
  }, [active]);
}
