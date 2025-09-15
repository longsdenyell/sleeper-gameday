import { useEffect, useRef, useState } from "react";

function jitter(ms: number) {
  const j = Math.floor(ms * 0.25);
  return ms + Math.floor(Math.random() * (j * 2) - j);
}

export function usePolling(fn: () => Promise<any>, { interval = 15000 } = {}) {
  const [isPolling, setIsPolling] = useState(false);
  const timer = useRef<number | null>(null);
  const active = useRef(true);

  async function tick() {
    if (!active.current) return;
    setIsPolling(true);
    try { await fn(); } finally { setIsPolling(false); }
    if (!active.current) return;
    timer.current = window.setTimeout(tick, jitter(interval));
  }

  function start() {
    if (timer.current) return;
    active.current = true;
    tick();
  }
  function stop() {
    active.current = false;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  }
  function refreshNow() {
    stop();
    start();
  }

  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isPolling, refreshNow, stop, start };
}
