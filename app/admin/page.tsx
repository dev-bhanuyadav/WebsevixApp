"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import ActivityFeed, { ActivityItem } from "@/components/admin/ActivityFeed";
import RevenueChart from "@/components/admin/RevenueChart";
import OrdersDonut from "@/components/admin/OrdersDonut";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  totalOrders: number;
  ordersThisMonth: number;
  pendingReview: number;
  totalUsers: number;
  totalRevenue: number;
  placementFees: number;
  inProgress: number;
  completed: number;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  placements: number;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as number[] } },
};

function SectionSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-xl animate-pulse"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    fetch("/api/admin/dashboard/stats", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: DashboardStats) => setStats(d))
      .catch(console.error)
      .finally(() => setLoadingStats(false));

    fetch("/api/admin/dashboard/activity", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: { activity?: ActivityItem[] }) => {
        if (Array.isArray(d.activity)) setActivityItems(d.activity);
      })
      .catch(console.error)
      .finally(() => setLoadingActivity(false));
  }, [accessToken]);

  const revenueData: RevenueDataPoint[] = useMemo(() => {
    if (!stats) return [];
    const days = 30;
    const today = new Date();
    return Array.from({ length: days }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - i));
      const seed = i + 1;
      return {
        date: d.toISOString().slice(0, 10),
        revenue: Math.floor((stats.totalRevenue / days) * (0.5 + Math.sin(seed * 0.7) * 0.5 + 0.1)),
        placements: Math.floor((stats.placementFees / days) * (0.4 + Math.sin(seed * 1.2) * 0.4 + 0.1)),
      };
    });
  }, [stats]);

  const donutData = useMemo(
    () => ({
      pending: stats?.pendingReview ?? 0,
      inProgress: stats?.inProgress ?? 0,
      completed: stats?.completed ?? 0,
      cancelled: 0,
    }),
    [stats]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-snow">Command Center</h1>
        <p className="text-sm text-slate mt-1">Real-time overview of all platform activity</p>
      </div>

      {/* Stat cards */}
      {loadingStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <motion.div variants={itemVariants}>
            <StatCard
              label="Total Orders"
              value={stats?.totalOrders ?? 0}
              icon={Package}
              iconColor="#818CF8"
              iconBg="rgba(99,102,241,0.15)"
              delay={0}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              label="This Month"
              value={stats?.ordersThisMonth ?? 0}
              icon={TrendingUp}
              iconColor="#22D3EE"
              iconBg="rgba(34,211,238,0.12)"
              delay={0.04}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              label="Pending Review"
              value={stats?.pendingReview ?? 0}
              icon={Clock}
              iconColor="#F59E0B"
              iconBg="rgba(245,158,11,0.12)"
              delay={0.08}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              label="Total Users"
              value={stats?.totalUsers ?? 0}
              icon={Users}
              iconColor="#A78BFA"
              iconBg="rgba(167,139,250,0.12)"
              delay={0.12}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              label="Total Revenue"
              value={stats?.totalRevenue ?? 0}
              icon={DollarSign}
              iconColor="#10B981"
              iconBg="rgba(16,185,129,0.12)"
              prefix="₹"
              delay={0.16}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              label="Placement Fees"
              value={stats?.placementFees ?? 0}
              icon={CreditCard}
              iconColor="#FB7185"
              iconBg="rgba(251,113,133,0.12)"
              prefix="₹"
              delay={0.2}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Charts section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 xl:grid-cols-5 gap-5"
      >
        <div className="xl:col-span-3">
          <RevenueChart data={revenueData} loading={loadingStats} />
        </div>
        <div className="xl:col-span-2">
          <OrdersDonut data={donutData} loading={loadingStats} />
        </div>
      </motion.div>

      {/* Activity + Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 xl:grid-cols-2 gap-5"
      >
        {/* Activity feed */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <h3 className="text-sm font-semibold font-display text-snow mb-4">Recent Activity</h3>
          {loadingActivity ? (
            <SectionSkeleton rows={4} />
          ) : (
            <ActivityFeed items={activityItems} />
          )}
        </div>

        {/* Quick actions */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <h3 className="text-sm font-semibold font-display text-snow">Quick Actions</h3>

          <Link href="/admin/orders?status=pending_review">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center justify-between p-4 rounded-xl cursor-pointer group overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(139,92,246,0.08) 100%)",
                border: "1px solid rgba(99,102,241,0.22)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ background: "rgba(99,102,241,0.2)" }}
                >
                  <Package size={18} style={{ color: "#818CF8" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-snow">Jump to New Orders</p>
                  <p className="text-xs text-slate">
                    {stats?.pendingReview
                      ? `${stats.pendingReview} order${stats.pendingReview > 1 ? "s" : ""} awaiting review`
                      : "Review pending orders"}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: "#818CF8" }} className="group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </Link>

          <Link href="/admin/users">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center justify-between p-4 rounded-xl cursor-pointer group overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.04) 100%)",
                border: "1px solid rgba(16,185,129,0.18)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ background: "rgba(16,185,129,0.14)" }}
                >
                  <Users size={18} style={{ color: "#10B981" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-snow">Manage Users</p>
                  <p className="text-xs text-slate">View all registered clients</p>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: "#10B981" }} className="group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </Link>

          <Link href="/admin/analytics">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center justify-between p-4 rounded-xl cursor-pointer group overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.04) 100%)",
                border: "1px solid rgba(245,158,11,0.18)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.14)" }}
                >
                  <TrendingUp size={18} style={{ color: "#F59E0B" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-snow">View Analytics</p>
                  <p className="text-xs text-slate">Platform performance insights</p>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: "#F59E0B" }} className="group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
