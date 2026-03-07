"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useOTPTimer(onExpire?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const endAtRef = useRef<number | null>(null);

  const start = useCallback((durationSeconds: number) => {
    endAtRef.current = Date.now() + durationSeconds * 1000;
    setSecondsLeft(durationSeconds);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const tick = () => {
      if (endAtRef.current === null) return;
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) onExpire?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft > 0]);

  return { secondsLeft, start, canResend: secondsLeft <= 0 };
}
