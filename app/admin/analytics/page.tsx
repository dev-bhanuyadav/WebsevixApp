"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Users,
  TrendingUp,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import OrdersDonut from "@/components/admin/OrdersDonut";
import UserGrowthChart from "@/components/admin/UserGrowthChart";
import { useAuth } from "@/hooks/useAuth";

type Range = "7d" | "30d" | "90d";

interface AnalyticsData {
  totalOrders: number;
  newUsers: number;
  completionRate: number;
  avgPerDay: number;
  ordersByDay: { date: string; count: number; revenue: number }[];
  usersByDay: { date: string; count: number }[];
  typeDist: { type: string; count: number }[];
  statusDist: {
    pendingReview: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
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
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-xs text-silver">{entry.name}:</span>
          <span className="text-xs font-bold text-snow ml-auto pl-3">
            {typeof entry.value === "number" && entry.name.toLowerCase().includes("revenue")
              ? `₹${entry.value.toLocaleString("en-IN")}`
              : entry.value.toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div
        className="h-24 rounded-2xl animate-pulse"
        style={{ background: "rgba(255,255,255,0.04)" }}
      />
    );
  }
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
        style={{ background: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-xs text-slate uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold font-display text-snow">{value}</p>
      </div>
    </div>
  );
}

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
];

const TYPE_COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#22D3EE", "#A78BFA", "#FB7185", "#34D399",
];

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuth();
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetch(`/api/admin/analytics?range=${range}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: AnalyticsData & { error?: string }) => {
        if (!d.error) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, range]);

  const donutData = useMemo(
    () => ({
      pending: data?.statusDist.pendingReview ?? 0,
      inProgress: data?.statusDist.inProgress ?? 0,
      completed: data?.statusDist.completed ?? 0,
      cancelled: data?.statusDist.cancelled ?? 0,
    }),
    [data]
  );

  const userGrowthData = useMemo(
    () => (data?.usersByDay ?? []).map((d) => ({ date: d.date, count: d.count })),
    [data]
  );

  const ordersChartData = useMemo(() => data?.ordersByDay ?? [], [data]);

  const typeDistData = useMemo(
    () =>
      (data?.typeDist ?? []).map((t, i) => ({
        ...t,
        color: TYPE_COLORS[i % TYPE_COLORS.length],
      })),
    [data]
  );

  const mostPopularType = useMemo(() => {
    if (!data?.typeDist.length) return "—";
    return [...data.typeDist].sort((a, b) => b.count - a.count)[0]?.type ?? "—";
  }, [data]);

  const ChartSkeleton = () => (
    <div
      className="h-[260px] rounded-xl animate-pulse"
      style={{ background: "rgba(255,255,255,0.04)" }}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-snow">Analytics</h1>
          <p className="text-sm text-slate mt-0.5">Platform performance insights</p>
        </div>

        {/* Range selector */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Orders"
          value={data?.totalOrders?.toString() ?? "0"}
          icon={Package}
          iconColor="#818CF8"
          iconBg="rgba(99,102,241,0.15)"
          loading={loading}
        />
        <SummaryCard
          label="New Users"
          value={data?.newUsers?.toString() ?? "0"}
          icon={Users}
          iconColor="#22D3EE"
          iconBg="rgba(34,211,238,0.12)"
          loading={loading}
        />
        <SummaryCard
          label="Avg / Day"
          value={data ? data.avgPerDay.toFixed(1) : "0.0"}
          icon={TrendingUp}
          iconColor="#F59E0B"
          iconBg="rgba(245,158,11,0.12)"
          loading={loading}
        />
        <SummaryCard
          label="Completion Rate"
          value={data ? `${data.completionRate.toFixed(0)}%` : "0%"}
          icon={CheckCircle2}
          iconColor="#10B981"
          iconBg="rgba(16,185,129,0.12)"
          loading={loading}
        />
      </div>

      {/* Charts 2x2 grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Top left: Orders trend */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <h3 className="text-sm font-semibold font-display text-snow mb-1">Orders Trend</h3>
          <p className="text-xs text-slate mb-4">Daily order volume &amp; revenue</p>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={ordersChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRevAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
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
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Orders"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#gradOrders)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (₹)"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#gradRevAnalytics)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top right: Orders Donut */}
        <OrdersDonut data={donutData} loading={loading} />

        {/* Bottom left: User Growth */}
        <UserGrowthChart data={userGrowthData} loading={loading} />

        {/* Bottom right: Project Type distribution */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <h3 className="text-sm font-semibold font-display text-snow mb-1">Project Types</h3>
          <p className="text-xs text-slate mb-4">Most requested project categories</p>
          {loading ? (
            <ChartSkeleton />
          ) : typeDistData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center">
              <p className="text-sm text-slate">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={typeDistData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="type"
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 14) + "…" : v)}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="count" name="Orders" radius={[0, 4, 4, 0]} barSize={16}>
                  {typeDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Key metrics */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h3 className="text-sm font-semibold font-display text-snow mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: "Most Popular Project Type",
              value: loading ? "…" : mostPopularType,
              icon: BarChart3,
              color: "#818CF8",
            },
            {
              label: "Completion Rate",
              value: loading ? "…" : `${data?.completionRate.toFixed(1) ?? 0}%`,
              icon: CheckCircle2,
              color: "#10B981",
            },
            {
              label: "Avg Orders / Day",
              value: loading ? "…" : (data?.avgPerDay.toFixed(2) ?? "0.00"),
              icon: TrendingUp,
              color: "#F59E0B",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                style={{ background: `${m.color}18` }}
              >
                <m.icon size={15} style={{ color: m.color }} />
              </div>
              <div>
                <p className="text-xs text-slate">{m.label}</p>
                <p className="text-sm font-bold text-snow">{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
