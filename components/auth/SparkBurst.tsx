"use client";

import { useEffect, useRef } from "react";

interface Spark {
  x: number; y: number;
  vx: number; vy: number;
  life: number; size: number;
  color: string;
}

interface SparkBurstProps {
  x: number;
  y: number;
  /** Increment this value to trigger a new burst */
  trigger: number;
}

const COLORS = ["#10B981", "#34D399", "#6EE7B7", "#ffffff", "#A7F3D0"];

export function SparkBurst({ x, y, trigger }: SparkBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const sparks    = useRef<Spark[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Spawn 12 sparks in all directions
    sparks.current = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 1.8 + Math.random() * 3.2;
      return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 1.0,
        size: 1.5 + Math.random() * 2.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });

    cancelAnimationFrame(rafRef.current);
    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      let alive = false;
      for (const s of sparks.current) {
        s.x  += s.vx;
        s.y  += s.vy;
        s.vy += 0.14;   // gravity
        s.life -= 0.038;
        if (s.life > 0) {
          alive = true;
          ctx!.globalAlpha = s.life;
          ctx!.beginPath();
          ctx!.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
          ctx!.fillStyle = s.color;
          ctx!.fill();
        }
      }
      ctx!.globalAlpha = 1;
      if (alive) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger, x, y]);

  if (typeof window === "undefined") return null;

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 10000 }}
    />
  );
}
