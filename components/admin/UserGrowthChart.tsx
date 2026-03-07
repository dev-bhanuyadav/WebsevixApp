"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataPoint {
  date: string;
  count: number;
}

interface UserGrowthChartProps {
  data: DataPoint[];
  loading?: boolean;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
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
      className="rounded-xl px-3 py-2.5"
      style={{
        background: "rgba(6,6,8,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        backdropFilter: "blur(16px)",
      }}
    >
      <p className="text-[11px] text-slate mb-1">{label}</p>
      <p className="text-sm font-bold text-snow">
        +{payload[0].value.toLocaleString("en-IN")}{" "}
        <span className="text-xs font-normal text-slate">users</span>
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="h-[200px] flex items-end gap-2 px-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-lg animate-pulse"
          style={{
            background: "rgba(255,255,255,0.07)",
            height: `${25 + ((i * 17) % 60) + 15}%`,
          }}
        />
      ))}
    </div>
  );
}

// Custom bar shape with rounded top corners
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RoundedBar(props: any) {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  const r = Math.min(4, width / 2);
  return (
    <path
      d={`
        M ${x + r},${y}
        h ${width - 2 * r}
        q ${r},0 ${r},${r}
        v ${height - r}
        h ${-(width)}
        v ${-(height - r)}
        q 0,${-r} ${r},${-r}
        z
      `}
      fill={fill}
    />
  );
}

export default function UserGrowthChart({ data, loading = false }: UserGrowthChartProps) {
  const maxVal = data.reduce((m, d) => Math.max(m, d.count), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold font-display text-snow">User Growth</h3>
        <p className="text-xs text-slate mt-0.5">New registrations over time</p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-slate">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={20}>
            <defs>
              <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="gradBarActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818CF8" stopOpacity={1} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.8} />
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
                return isNaN(d.getTime())
                  ? v
                  : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
              }}
            />

            <YAxis
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)", radius: 4 }}
            />

            <Bar dataKey="count" shape={<RoundedBar />} name="New Users">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.count === maxVal && maxVal > 0
                      ? "url(#gradBarActive)"
                      : "url(#gradBar)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
