"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  animatedBorder?: boolean;
}

export default function Badge({
  children,
  className = "",
  animatedBorder = true,
}: BadgeProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.span
      className={`
        inline-flex items-center gap-2 px-4 py-1.5 rounded-full
        bg-white/5 border border-white/10 text-text-muted text-sm font-medium
        ${animatedBorder && !reducedMotion ? "animate-shimmer" : ""}
        ${className}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      style={
        animatedBorder && !reducedMotion
          ? {
              backgroundImage:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
              backgroundSize: "200% 100%",
            }
          : undefined
      }
    >
      {children}
    </motion.span>
  );
}
