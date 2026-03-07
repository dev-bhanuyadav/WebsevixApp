"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";
import { useCountAnimation } from "@/hooks/useCountAnimation";

interface DonutData {
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

interface OrdersDonutProps {
  data: DonutData;
  loading?: boolean;
}

const SEGMENTS = [
  { key: "pending" as const, label: "Pending", color: "#F59E0B" },
  { key: "inProgress" as const, label: "In Progress", color: "#22D3EE" },
  { key: "completed" as const, label: "Completed", color: "#10B981" },
  { key: "cancelled" as const, label: "Cancelled", color: "#EF4444" },
];

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { color: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        background: "rgba(6,6,8,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: entry.payload.color }}
        />
        <span className="text-xs text-silver">{entry.name}:</span>
        <span className="text-xs font-bold text-snow ml-1">{entry.value}</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 7}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="w-[180px] h-[180px] rounded-full animate-pulse"
        style={{ background: "rgba(255,255,255,0.05)" }}
      />
      <div className="flex flex-wrap justify-center gap-3">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="w-16 h-3 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersDonut({ data, loading = false }: OrdersDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const total = data.pending + data.inProgress + data.completed + data.cancelled;
  const { count: animatedTotal, ref: totalRef } = useCountAnimation(total, 1200, true);

  const chartData = SEGMENTS.map((s) => ({
    name: s.label,
    value: data[s.key],
    color: s.color,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold font-display text-snow">Orders Breakdown</h3>
        <p className="text-xs text-slate mt-0.5">Distribution by status</p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Donut + center label */}
          <div className="relative" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                ref={totalRef}
                className="text-2xl font-bold font-display text-snow"
              >
                {animatedTotal}
              </span>
              <span className="text-xs text-slate mt-0.5">Total</span>
            </div>
          </div>

          {/* Custom legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {SEGMENTS.map((s, i) => (
              <div
                key={s.key}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all"
                style={{
                  background:
                    activeIndex === i
                      ? `${s.color}14`
                      : "rgba(255,255,255,0.03)",
                  border: `1px solid ${activeIndex === i ? `${s.color}30` : "rgba(255,255,255,0.06)"}`,
                }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: s.color }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate truncate">{s.label}</span>
                  <span className="text-sm font-bold text-snow">{data[s.key]}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
