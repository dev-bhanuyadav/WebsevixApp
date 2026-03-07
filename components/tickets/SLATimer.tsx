"use client";

import { useEffect, useState } from "react";

interface SLATimerProps {
  deadline: Date | string | null;
  isBreach: boolean;
  compact?: boolean;
}

export function SLATimer({ deadline, isBreach, compact }: SLATimerProps) {
  const [left, setLeft] = useState<string>("");

  useEffect(() => {
    if (!deadline) {
      setLeft("—");
      return;
    }
    const d = new Date(deadline);
    const tick = () => {
      const now = new Date();
      if (now >= d) {
        setLeft("Overdue");
        return;
      }
      const ms = d.getTime() - now.getTime();
      const h = Math.floor(ms / (60 * 60 * 1000));
      const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
      if (h >= 24) setLeft(`${Math.floor(h / 24)}d left`);
      else if (h > 0) setLeft(`${h}h ${m}m left`);
      else setLeft(`${m} min left`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline) return null;

  const overdue = left === "Overdue" || isBreach;
  const urgent = !overdue && left.includes("min");

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        overdue ? "text-red-400" : urgent ? "text-amber-400" : "text-emerald-400"
      }`}
      title={new Date(deadline).toLocaleString()}
    >
      {compact ? left : `SLA: ${left}`}
    </span>
  );
}
