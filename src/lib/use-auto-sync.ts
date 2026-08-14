import { useCallback, useEffect, useRef, useState } from 'react';

export interface AutoSync {
  /** whole seconds left until the next automatic sync */
  remaining: number;
  /** true while a sync is in flight */
  syncing: boolean;
  /** trigger a sync immediately */
  sync: () => void;
  /** restart the countdown (e.g. after a manual refresh) */
  reset: () => void;
}

/**
 * Timestamp-based auto-refresh countdown, the newsroom pattern. Calls onSync
 * every refreshSeconds; the deadline is stored as a timestamp so the countdown
 * self-corrects after browser tab throttling and catches up immediately when
 * the tab regains focus. Manual triggers (sync/reset) are safe mid-flight.
 */
export function useAutoSync(refreshSeconds: number, onSync: () => void | Promise<void>): AutoSync {
  const [remaining, setRemaining] = useState(refreshSeconds);
  const [syncing, setSyncing] = useState(false);
  const nextSyncAt = useRef(Date.now() + refreshSeconds * 1000);
  const busy = useRef(false);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const run = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setSyncing(true);
    try {
      await onSyncRef.current();
    } finally {
      busy.current = false;
      setSyncing(false);
      nextSyncAt.current = Date.now() + refreshSeconds * 1000;
      setRemaining(refreshSeconds);
    }
  }, [refreshSeconds]);

  const reset = useCallback(() => {
    nextSyncAt.current = Date.now() + refreshSeconds * 1000;
    setRemaining(refreshSeconds);
  }, [refreshSeconds]);

  useEffect(() => {
    nextSyncAt.current = Date.now() + refreshSeconds * 1000;
    setRemaining(refreshSeconds);
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((nextSyncAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) void run();
    }, 1000);
    return () => clearInterval(id);
  }, [refreshSeconds, run]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) return;
      const left = Math.max(0, Math.round((nextSyncAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) void run();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [run]);

  const sync = useCallback(() => {
    void run();
  }, [run]);

  return { remaining, syncing, sync, reset };
}
