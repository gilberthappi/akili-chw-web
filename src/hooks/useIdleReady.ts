import { useEffect, useState } from "react";

/**
 * Becomes true after the browser is idle (or after `timeoutMs` fallback).
 * Used to defer non-critical dashboard fetches until after first paint.
 */
export function useIdleReady(timeoutMs: number = 2500): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const mark = () => {
      if (!cancelled) setReady(true);
    };

    const ric = (
      window as Window & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;

    if (typeof ric === "function") {
      idleId = ric(mark, { timeout: timeoutMs });
    } else {
      timerId = setTimeout(mark, timeoutMs);
    }

    return () => {
      cancelled = true;
      const cic = (
        window as Window & { cancelIdleCallback?: (id: number) => void }
      ).cancelIdleCallback;
      if (idleId != null && typeof cic === "function") cic(idleId);
      if (timerId != null) clearTimeout(timerId);
    };
  }, [timeoutMs]);

  return ready;
}
