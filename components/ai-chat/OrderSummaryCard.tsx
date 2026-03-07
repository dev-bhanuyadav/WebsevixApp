"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import type { AIResponse } from "@/lib/aiPrompt";

interface OrderSummaryCardProps {
  data: AIResponse["collectedData"];
  progress: number;
  onPlace: () => void;
  isPlacing?: boolean;
  isComplete?: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  projectType:  "Project Type",
  description:  "Description",
  designStyle:  "Design Style",
  budget:       "Budget",
  timeline:     "Timeline",
};

export function OrderSummaryCard({ data, progress, onPlace, isPlacing, isComplete }: OrderSummaryCardProps) {
  const filledFields = Object.entries(FIELD_LABELS).filter(([k]) => data[k as keyof typeof data]);
  const features = data.features ?? [];

  return (
    <motion.div
      className="h-full flex flex-col rounded-2xl border border-white/[0.08] overflow-hidden"
      style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)" }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="font-display font-semibold text-snow text-sm">Order Summary</h3>
        <p className="text-xs text-slate mt-0.5">Updates as you chat with Vix</p>
      </div>

      {/* Progress */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate">Profile complete</span>
          <span className="text-snow font-semibold">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#6366F1,#8B5CF6,#06B6D4)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Collected fields */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {Object.entries(FIELD_LABELS).map(([key, label]) => {
          const val = data[key as keyof typeof data];
          return (
            <motion.div
              key={key}
              className={`flex items-start gap-3 transition-opacity ${val ? "opacity-100" : "opacity-30"}`}
              animate={{ opacity: val ? 1 : 0.3 }}
            >
              <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                val ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/[0.05] border border-white/10"
              }`}>
                {val ? <Check size={11} className="text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-white/20" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate">{label}</p>
                <p className="text-sm text-snow truncate">{val as string ?? "—"}</p>
              </div>
            </motion.div>
          );
        })}

        {/* Features */}
        {features.length > 0 && (
          <div>
            <p className="text-xs text-slate mb-1.5">Features</p>
            <div className="flex flex-wrap gap-1.5">
              {features.map(f => (
                <motion.span
                  key={f}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                >
                  {f}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate">Order Placement Fee</span>
          <span className="font-display font-bold text-snow">₹500</span>
        </div>
        <p className="text-xs text-slate">This confirms your project slot with our team</p>

        <motion.button
          onClick={onPlace}
          disabled={!isComplete || isPlacing}
          className="relative w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
          style={{ background: isComplete ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "rgba(255,255,255,0.06)" }}
          whileHover={isComplete ? { scale: 1.02 } : {}}
          whileTap={isComplete ? { scale: 0.97 } : {}}
        >
          {isComplete && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
              animate={{ x: ["-150%","300%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Sparkles size={16} />
            {isPlacing ? "Processing…" : "Place Order — ₹500"}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
