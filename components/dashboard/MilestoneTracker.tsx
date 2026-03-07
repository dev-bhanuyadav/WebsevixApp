"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Loader2, ChevronDown } from "lucide-react";
import type { IMilestone } from "@/models/Order";

interface MilestoneTrackerProps {
  milestones: IMilestone[];
}

export function MilestoneTracker({ milestones }: MilestoneTrackerProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = [...milestones].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-2">
      {sorted.map((ms, i) => {
        const isExpanded = expanded === ms._id?.toString();
        const isLast     = i === sorted.length - 1;

        return (
          <motion.div
            key={ms._id?.toString() ?? i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 }}
          >
            <button
              className="w-full text-left"
              onClick={() => setExpanded(isExpanded ? null : ms._id?.toString() ?? null)}
            >
              <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors duration-200 ${
                ms.status === "active"    ? "border-cyan-500/30 bg-cyan-500/[0.06]" :
                ms.status === "completed" ? "border-emerald-500/20 bg-emerald-500/[0.04]" :
                "border-white/[0.06] bg-white/[0.02] opacity-60"
              }`}>
                {/* Icon */}
                <div className="flex-shrink-0 relative">
                  {ms.status === "completed" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <CheckCircle2 size={22} className="text-emerald-400" />
                    </motion.div>
                  )}
                  {ms.status === "active" && (
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 rounded-full bg-cyan-400/30"
                        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <Loader2 size={22} className="text-cyan-400 animate-spin" />
                    </div>
                  )}
                  {ms.status === "pending" && (
                    <Circle size={22} className="text-white/20" />
                  )}

                  {/* Connector line */}
                  {!isLast && (
                    <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 w-0.5 h-6 rounded-full ${
                      ms.status === "completed" ? "bg-emerald-500/30" : "bg-white/[0.06]"
                    }`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      ms.status === "completed" ? "text-silver" :
                      ms.status === "active"    ? "text-snow"   : "text-slate"
                    }`}>
                      {ms.title}
                    </span>
                    {ms.status === "active" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 font-medium">
                        Active
                      </span>
                    )}
                    {ms.status === "completed" && ms.completedAt && (
                      <span className="text-xs text-slate ml-auto">
                        {new Date(ms.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronDown
                  size={15}
                  className={`text-slate flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && ms.description && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 pt-1 ml-10 text-sm text-slate leading-relaxed">
                    {ms.description}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
