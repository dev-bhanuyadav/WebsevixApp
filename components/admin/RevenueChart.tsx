"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DataPoint {
  date: string;
  revenue: number;
  placements: number;
}

interface RevenueChartProps {
  data: DataPoint[];
  loading?: boolean;
}

type Range = 7 | 30 | 90;

function formatINR(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 space-y-1.5"
      style={{
        background: "rgba(6,6,8,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        backdropFilter: "blur(16px)",
      }}
    >
      <p className="text-xs font-medium text-slate mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-xs text-silver">{entry.name}:</span>
          <span className="text-xs font-bold text-snow ml-auto pl-3">
            {formatINR(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="h-[280px] rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }}>
      <div className="h-full flex items-end gap-2 p-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-lg"
            style={{
              background: "rgba(255,255,255,0.06)",
              height: `${30 + Math.sin(i * 0.8) * 40 + 40}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function RevenueChart({ data, loading = false }: RevenueChartProps) {
  const [range, setRange] = useState<Range>(30);

  const filtered = useMemo(() => {
    if (!data.length) return [];
    return data.slice(-range);
  }, [data, range]);

  const ranges: { label: string; value: Range }[] = [
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
    { label: "90 Days", value: 90 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold font-display text-snow">Revenue Overview</h3>
          <p className="text-xs text-slate mt-0.5">Total revenue & placement fees</p>
        </div>

        {/* Range toggle */}
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                background: range === r.value ? "rgba(99,102,241,0.22)" : "transparent",
                color: range === r.value ? "#A5B4FC" : "#64748B",
                border: range === r.value ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={filtered} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPlacements" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
              }}
            />

            <YAxis
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatINR}
              width={52}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />

            <Legend
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value: string) => (
                <span style={{ color: "#94A3B8", fontSize: 11 }}>{value}</span>
              )}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              name="Total Revenue"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#gradRevenue)"
              dot={false}
              activeDot={{ r: 4, fill: "#6366F1", stroke: "rgba(6,6,8,0.8)", strokeWidth: 2 }}
            />

            <Area
              type="monotone"
              dataKey="placements"
              name="Placement Fees"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill="url(#gradPlacements)"
              dot={false}
              activeDot={{ r: 4, fill: "#8B5CF6", stroke: "rgba(6,6,8,0.8)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
