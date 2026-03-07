"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  CreditCard,
  UserPlus,
  MessageSquare,
  CheckCircle,
  Activity,
} from "lucide-react";

export interface ActivityItem {
  id: string;
  type: "order" | "payment" | "user" | "message" | "milestone";
  text: string;
  time: string;
  orderId?: string;
  amount?: number;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
}

const TYPE_CONFIG: Record<
  ActivityItem["type"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  order: { icon: ShoppingBag, color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  payment: { icon: CreditCard, color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  user: { icon: UserPlus, color: "#38BDF8", bg: "rgba(56,189,248,0.12)" },
  message: { icon: MessageSquare, color: "#818CF8", bg: "rgba(129,140,248,0.12)" },
  milestone: { icon: CheckCircle, color: "#34D399", bg: "rgba(52,211,153,0.12)" },
};

function SkeletonLine({ width }: { width: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded-xl animate-pulse flex-shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.07)", width }} />
        <div className="h-2.5 rounded animate-pulse w-20" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
    </div>
  );
}

export default function ActivityFeed({ items, loading = false }: ActivityFeedProps) {
  const prevIds = useRef<Set<string>>(new Set());
  const newItemIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(items.map((i) => i.id));
    items.forEach((item) => {
      if (!prevIds.current.has(item.id)) {
        newItemIds.current.add(item.id);
        // Clear the highlight after 1s
        setTimeout(() => {
          newItemIds.current.delete(item.id);
        }, 1100);
      }
    });
    prevIds.current = currentIds;
  }, [items]);

  if (loading) {
    return (
      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <SkeletonLine width="65%" />
        <SkeletonLine width="80%" />
        <SkeletonLine width="55%" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Activity size={36} className="text-slate" />
        </motion.div>
        <p className="text-sm text-slate text-center">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
      <AnimatePresence initial={false}>
        {items.map((item, index) => {
          const cfg = TYPE_CONFIG[item.type];
          const Icon = cfg.icon;
          const isNew = newItemIds.current.has(item.id);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex items-start gap-3 px-1 py-3 rounded-xl transition-colors"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: isNew
                  ? "rgba(245,158,11,0.09)"
                  : "transparent",
                transition: "background 1s ease",
              }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 mt-0.5"
                style={{ background: cfg.bg }}
              >
                <Icon size={14} style={{ color: cfg.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-silver leading-snug">
                  {item.text}
                  {item.amount !== undefined && (
                    <span className="font-semibold text-snow ml-1">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </span>
                  )}
                  {item.orderId && (
                    <span className="ml-1 text-xs font-mono" style={{ color: cfg.color }}>
                      #{item.orderId}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate mt-0.5">{item.time}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
