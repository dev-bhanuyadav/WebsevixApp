"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useCountAnimation } from "@/hooks/useCountAnimation";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string; positive: boolean };
  delay?: number;
  prefix?: string;
  suffix?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "#818CF8",
  iconBg = "rgba(99,102,241,0.15)",
  trend,
  delay = 0,
  prefix = "",
  suffix = "",
}: StatCardProps) {
  const isNumeric = typeof value === "number";
  const { count, ref: countRef } = useCountAnimation(
    isNumeric ? (value as number) : 0,
    1500,
    true
  );

  const displayValue = isNumeric
    ? `${prefix}${count.toLocaleString("en-IN")}${suffix}`
    : `${prefix}${value}${suffix}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-2xl p-5 cursor-default"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 8px 40px rgba(0,0,0,0.45), 0 0 20px ${iconColor}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 24px rgba(0,0,0,0.3)";
      }}
    >
      {/* Subtle card shine */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0) 50%)",
        }}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        {/* Text content */}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-medium text-slate uppercase tracking-wider">
            {label}
          </span>

          <span
            ref={countRef}
            className="text-2xl font-bold font-display text-snow leading-tight"
          >
            {displayValue}
          </span>

          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend.positive ? (
                <TrendingUp size={13} style={{ color: "#10B981" }} />
              ) : (
                <TrendingDown size={13} style={{ color: "#EF4444" }} />
              )}
              <span
                className="text-xs font-semibold"
                style={{ color: trend.positive ? "#10B981" : "#EF4444" }}
              >
                {trend.positive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-slate">{trend.label}</span>
            </div>
          )}
        </div>

        {/* Icon box */}
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
      </div>
    </motion.div>
  );
}
