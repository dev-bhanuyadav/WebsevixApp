"use client";

import { useState, useCallback, useRef } from "react";

export type BlastPhase =
  | "idle"     // not started
  | "blast"    // 0–700ms  : canvas particles + rings + warp
  | "portal"   // 700–1200ms: portal expands
  | "modal"    // 1200ms+  : modal card materializes
  | "content"  // 1700ms+  : content choreography
  | "ambient"; // 2500ms+  : idle ambient loops

export interface BlastOrigin {
  x: number;
  y: number;
}

export function useBlast() {
  const [phase, setPhase] = useState<BlastPhase>("idle");
  const [origin, setOrigin] = useState<BlastOrigin>({ x: 0, y: 0 });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  }, []);

  const trigger = useCallback(
    (ox?: number, oy?: number) => {
      clearTimers();
      const x = ox ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 500);
      const y = oy ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 400);
      setOrigin({ x, y });
      setPhase("blast");
      schedule(() => setPhase("portal"),  700);
      schedule(() => setPhase("modal"),   1200);
      schedule(() => setPhase("content"), 1700);
      schedule(() => setPhase("ambient"), 2500);
    },
    [clearTimers, schedule]
  );

  const reset = useCallback(() => {
    clearTimers();
    setPhase("idle");
  }, [clearTimers]);

  return { phase, origin, trigger, reset };
}
