"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  prefix?: string;
  suffix?: string;
  trend?: { value: number; label: string };
  delay?: number;
}

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf.current); };
  }, [target, duration, delay]);

  return count;
}

export function StatCard({ label, value, icon: Icon, iconColor = "text-indigo-400", iconBg = "bg-indigo-500/10 border-indigo-500/20", prefix = "", suffix = "", trend, delay = 0 }: StatCardProps) {
  const isNumber   = typeof value === "number";
  const displayVal = useCountUp(isNumber ? value : 0, 1200, delay * 1000 + 200);

  return (
    <motion.div
      className="relative rounded-2xl p-5 border border-white/[0.07] overflow-hidden group"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        backdropFilter: "blur(12px)",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
      whileHover={{ y: -2, boxShadow: "0 12px 32px rgba(99,102,241,0.1), 0 0 0 1px rgba(99,102,241,0.12)" }}
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)" }} />

      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <div className={`text-xs font-medium px-2 py-1 rounded-lg ${trend.value >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </div>
        )}
      </div>

      <p className="font-display font-bold text-2xl text-snow tabular-nums">
        {prefix}{isNumber ? displayVal.toLocaleString() : value}{suffix}
      </p>
      <p className="text-sm text-slate mt-1">{label}</p>
    </motion.div>
  );
}
