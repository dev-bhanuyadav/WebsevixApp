"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MessagesPage() {
  const { accessToken } = useAuth();
  const [orders,  setOrders]  = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/orders", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setOrders((d.orders ?? []).filter((o: Record<string, unknown>) => o.status !== "pending_review")))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-display font-bold text-2xl text-snow">Messages</h1>
        <p className="text-sm text-slate mt-1">Chat with the Websevix team about your projects</p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <motion.div
          className="rounded-2xl border border-white/[0.07] p-12 text-center"
          style={{ background: "rgba(255,255,255,0.02)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <MessageSquare className="w-7 h-7 text-indigo-400/60" />
          </div>
          <p className="text-silver font-medium mb-2">No active conversations</p>
          <p className="text-slate text-sm">Place an order to start chatting with our team</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {orders.map((o, i) => (
            <motion.div
              key={o.id as string}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <Link href={`/dashboard/client/orders/${o.orderId}/chat`}>
                <motion.div
                  className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.07] cursor-pointer group"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                  whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(99,102,241,0.1)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <MessageSquare size={18} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-snow truncate">{o.title as string}</p>
                    <p className="text-xs text-slate">{o.orderId as string} · Click to open chat</p>
                  </div>
                  <ExternalLink size={15} className="text-slate group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
