"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverTilt?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  delay = 0,
  hoverTilt = false,
}: GlassCardProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={
        reducedMotion || !hoverTilt
          ? {}
          : {
              y: -4,
              transition: { duration: 0.2 },
              boxShadow: "0 0 30px rgba(99, 102, 241, 0.15)",
            }
      }
    >
      {children}
    </motion.div>
  );
}
