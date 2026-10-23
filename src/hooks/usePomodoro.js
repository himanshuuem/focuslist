import { useEffect, useRef, useState } from "react";

export const MODES = {
  focus: { label: "Focus", minutes: 25 },
  short: { label: "Short break", minutes: 5 },
  long: { label: "Long break", minutes: 15 },
};

/**
 * Countdown based on a target timestamp (not on counting ticks), so it stays accurate
 * even when the tab is in the background and timers are throttled.
 */
export function usePomodoro({ onComplete, now = () => Date.now() } = {}) {
  const [mode, setMode] = useState("focus");
  const [remainingMs, setRemainingMs] = useState(MODES.focus.minutes * 60_000);
  const [running, setRunning] = useState(false);
  const endsAt = useRef(null);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    if (!running) return undefined;
    endsAt.current = now() + remainingMs;
    const timer = setInterval(() => {
      const left = Math.max(0, endsAt.current - now());
      setRemainingMs(left);
      if (left === 0) {
        clearInterval(timer);
        setRunning(false);
        completeRef.current?.(mode);
      }
    }, 250);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const switchMode = (next) => {
    setRunning(false);
    setMode(next);
    setRemainingMs(MODES[next].minutes * 60_000);
  };

  return {
    mode,
    running,
    remainingMs,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: () => switchMode(mode),
    switchMode,
  };
}

export function formatClock(ms) {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
