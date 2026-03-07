"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare, ExternalLink, Clock } from "lucide-react";
const STATUS_CONFIG = {
  pending_review: { label: "Pending Review", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  in_progress:    { label: "In Progress",    color: "text-cyan-400",  bg: "bg-cyan-500/10 border-cyan-500/20",   dot: "bg-cyan-400 animate-pulse" },
  completed:      { label: "Completed",      color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  cancelled:      { label: "Cancelled",      color: "text-red-400",   bg: "bg-red-500/10 border-red-500/20",     dot: "bg-red-400" },
};

type OrderStatus = keyof typeof STATUS_CONFIG;

function getProgress(order: { milestones?: Array<{ status: string }> }): number {
  const ms = order.milestones ?? [];
  if (!ms.length) return 0;
  const done = ms.filter(m => m.status === "completed").length;
  return Math.round((done / ms.length) * 100);
}

function getActiveMilestone(order: { milestones?: Array<{ status: string; title: string }> }): string {
  const active = order.milestones?.find(m => m.status === "active");
  return active?.title ?? "Pending review";
}

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

interface OrderCardProps {
  order: {
    id: string;
    orderId: string;
    title: string;
    status: OrderStatus;
    milestones?: Array<{ status: string; title: string }>;
    updatedAt: Date | string;
    aiSummary?: { budget?: string };
  };
  index?: number;
}

export function OrderCard({ order, index = 0 }: OrderCardProps) {
  const cfg      = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending_review;
  const progress = getProgress(order);
  const milestone = getActiveMilestone(order);

  return (
    <motion.div
      className="relative rounded-2xl p-5 border border-white/[0.07] group overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)" }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.1)" }}
    >
      {/* Top row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-indigo-400 font-mono font-medium">{order.orderId}</span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <h3 className="font-semibold text-snow text-sm truncate">{order.title}</h3>
        </div>
        {order.aiSummary?.budget && (
          <span className="text-sm font-semibold text-snow flex-shrink-0">{order.aiSummary.budget}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate mb-1.5">
          <span>{milestone}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#6366F1,#8B5CF6,#06B6D4)" }}
            initial={{ width: 0 }}
            whileInView={{ width: `${progress}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 + 0.3 }}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate">
          <Clock size={12} />
          <span>Updated {timeAgo(order.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/client/orders/${order.orderId}`}>
            <motion.button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-silver hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-300 transition-colors"
              whileTap={{ scale: 0.96 }}
            >
              <ExternalLink size={12} />
              View Details
            </motion.button>
          </Link>
          <Link href={`/dashboard/client/orders/${order.orderId}/chat`}>
            <motion.button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
              whileTap={{ scale: 0.96 }}
            >
              <MessageSquare size={12} />
              Chat
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
