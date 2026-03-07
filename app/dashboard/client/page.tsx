"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Package, CheckCircle, Clock, Wallet, Sparkles, ArrowRight, Activity,
  CircleDot, Circle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/dashboard/StatCard";
import { OrderCard } from "@/components/dashboard/OrderCard";

const STATUS_BADGE = {
  pending_review: { label: "Pending Review", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  in_progress:    { label: "In Progress",    cls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  completed:      { label: "Completed",      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  cancelled:      { label: "Cancelled",      cls: "text-red-400 bg-red-500/10 border-red-500/20" },
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(d: Date | string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)    return "just now";
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

export default function ClientOverviewPage() {
  const { user, accessToken } = useAuth();
  const [orders,  setOrders]  = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/orders", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setOrders(d.orders ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken]);

  const total     = orders.length;
  const active    = orders.filter(o => o.status === "in_progress").length;
  const completed = orders.filter(o => o.status === "completed").length;
  const recent    = orders.slice(0, 5);

  const activityItems = recent.map(o => ({
    id:        o.id as string,
    text:      `Order ${o.orderId} — ${(STATUS_BADGE[o.status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.pending_review).label}`,
    time:      timeAgo(o.updatedAt as string),
    iconType:  o.status === "completed" ? "done" : o.status === "in_progress" ? "active" : "pending",
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-snow">
          {greeting()},{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent"
            style={{ backgroundSize: "200% auto", animation: "gradient-text 8s ease infinite" }}>
            {user?.firstName ?? "there"}
          </span>
        </h1>
        <p className="text-slate mt-1.5 text-sm">Here&rsquo;s what&rsquo;s happening with your projects</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders"     value={total}     icon={Package}      delay={0.05} />
        <StatCard label="In Progress"      value={active}    icon={Clock}        delay={0.1}  iconColor="text-cyan-400"    iconBg="bg-cyan-500/10 border-cyan-500/20" />
        <StatCard label="Completed"        value={completed} icon={CheckCircle}  delay={0.15} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20" />
        <StatCard label="Total Spent"      value="₹—"        icon={Wallet}       delay={0.2}  iconColor="text-violet-400"  iconBg="bg-violet-500/10 border-violet-500/20" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-snow text-base">Recent Orders</h2>
            <Link href="/dashboard/client/orders" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-28 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <motion.div
              className="rounded-2xl border border-white/[0.07] p-10 text-center"
              style={{ background: "rgba(255,255,255,0.02)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <Package className="w-7 h-7 text-indigo-400" />
              </div>
              <p className="text-silver font-medium mb-1">No orders yet</p>
              <p className="text-slate text-sm mb-5">Start by placing your first order with Vix</p>
              <Link href="/dashboard/client/new-order">
                <motion.button
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                >
                  <span className="flex items-center gap-2"><Sparkles size={14} /> Place New Order</span>
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {recent.map((o, i) => <OrderCard key={o.id as string} order={o as never} index={i} />)}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* CTA banner */}
          <motion.div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)", border: "1px solid rgba(99,102,241,0.2)" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute right-4 top-4 w-20 h-20 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #6366F1 0%, transparent 70%)" }} />
            <Sparkles className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="font-display font-semibold text-snow text-sm mb-1">Ready to build?</h3>
            <p className="text-xs text-slate mb-4">Chat with Vix — our AI consultant — and get your project started</p>
            <Link href="/dashboard/client/new-order">
              <motion.button
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              >
                Start New Order →
              </motion.button>
            </Link>
          </motion.div>

          {/* Activity feed */}
          <motion.div
            className="rounded-2xl border border-white/[0.07] overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
              <Activity size={15} className="text-indigo-400" />
              <h3 className="font-display font-semibold text-snow text-sm">Activity</h3>
            </div>
            <div className="px-5 py-3 space-y-4 divide-y divide-white/[0.04]">
              {activityItems.length === 0 ? (
                <p className="text-xs text-slate py-4 text-center">No activity yet</p>
              ) : activityItems.map(item => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {item.iconType === "done"
                      ? <CheckCircle size={15} className="text-emerald-400" />
                      : item.iconType === "active"
                        ? <CircleDot size={15} className="text-cyan-400" />
                        : <Circle size={15} className="text-amber-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-silver leading-relaxed">{item.text}</p>
                    <p className="text-xs text-slate mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
