import { useEffect, useState } from 'react';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Most recent daily reset at or before `time`. Reset is given in minutes past 00:00 UTC. */
export function lastResetAt(time, resetUtcMinutes) {
  const d = new Date(time);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, resetUtcMinutes);
  return today <= time ? today : today - DAY_MS;
}

/**
 * Timestamp of the latest daily reset, kept current: a timer fires at the next
 * reset, and it re-checks when the tab becomes visible (background tabs throttle timers).
 */
export function useLastReset(resetUtcMinutes) {
  const [lastReset, setLastReset] = useState(() => lastResetAt(Date.now(), resetUtcMinutes));

  useEffect(() => {
    let timer;
    const sync = () => {
      const now = Date.now();
      const last = lastResetAt(now, resetUtcMinutes);
      setLastReset(last);
      clearTimeout(timer);
      timer = setTimeout(sync, last + DAY_MS - now + 1000);
    };
    const onVisible = () => document.visibilityState === 'visible' && sync();

    sync();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [resetUtcMinutes]);

  return lastReset;
}
