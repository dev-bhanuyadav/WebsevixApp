"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Package, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { OrderCard } from "@/components/dashboard/OrderCard";

type OrderStatus = "pending_review" | "in_progress" | "completed" | "cancelled" | "all";

const TABS: { label: string; value: OrderStatus }[] = [
  { label: "All",       value: "all" },
  { label: "Active",    value: "in_progress" },
  { label: "Pending",   value: "pending_review" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersPage() {
  const { accessToken } = useAuth();
  const [orders,   setOrders]   = useState<Array<Record<string, unknown>>>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<OrderStatus>("all");

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/orders", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setOrders(d.orders ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filtered = tab === "all" ? orders : orders.filter(o => o.status === tab);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-snow">My Orders</h1>
            <p className="text-sm text-slate mt-1">Track and manage all your projects</p>
          </div>
          <Link href="/dashboard/client/new-order">
            <motion.button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <Sparkles size={14} />
              New Order
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <motion.div
        className="flex items-center gap-1 p-1 rounded-xl border border-white/[0.07]"
        style={{ background: "rgba(255,255,255,0.02)", width: "fit-content" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              tab === t.value ? "text-snow" : "text-slate hover:text-silver"
            }`}
          >
            {tab === t.value && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 rounded-lg bg-white/[0.08]"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
                {t.value !== "all" && (
              <span className={`relative z-10 ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.value ? "bg-indigo-500/30 text-indigo-300" : "bg-white/[0.05] text-slate"
              }`}>
                {orders.filter(o => o.status === t.value).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Order list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          className="rounded-2xl border border-white/[0.07] p-12 text-center"
          style={{ background: "rgba(255,255,255,0.02)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <Package className="w-8 h-8 text-indigo-400/60" />
          </div>
          <p className="text-silver font-medium mb-1">
            {tab === "all" ? "No orders yet" : `No ${tab.replace("_", " ")} orders`}
          </p>
          <p className="text-slate text-sm mb-6">
            {tab === "all" ? "Place your first order to get started" : "Try a different filter"}
          </p>
          {tab === "all" && (
            <Link href="/dashboard/client/new-order">
              <motion.button
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              >
                <span className="flex items-center gap-2"><Sparkles size={14} /> Place New Order</span>
              </motion.button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o, i) => <OrderCard key={o.id as string} order={o as never} index={i} />)}
        </div>
      )}
    </div>
  );
}
