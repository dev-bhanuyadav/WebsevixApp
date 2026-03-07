"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { successCharVariants } from "@/lib/animations";
import type { BlastCanvasHandle } from "@/components/auth/BlastCanvas";

interface SuccessStepProps {
  firstName?: string;
  canvasRef?: React.RefObject<BlastCanvasHandle>;
}

const WELCOME = "Welcome!".split("");

export function SuccessStep({ firstName, canvasRef }: SuccessStepProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fire confetti on mount
  useEffect(() => {
    const t1 = setTimeout(() => {
      if (canvasRef?.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        canvasRef.current.confetti(cx, cy);
      }
    }, 400);

    return () => clearTimeout(t1);
  }, [canvasRef]);

  return (
    <motion.div
      ref={containerRef}
      className="py-5 text-center space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Checkmark circle */}
      <motion.div
        className="flex justify-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.1 }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center relative"
          style={{
            background: "linear-gradient(135deg, #10B981, #059669)",
            boxShadow: "0 0 32px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.2)",
          }}
        >
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-emerald-400"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          />
          {/* SVG checkmark */}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </svg>
        </div>
      </motion.div>

      {/* "Welcome!" char-by-char with random directions */}
      <div className="flex items-center justify-center flex-wrap gap-0">
        {WELCOME.map((char, i) => (
          <motion.span
            key={i}
            custom={i}
            variants={successCharVariants}
            initial="hidden"
            animate="visible"
            className="font-display font-bold text-2xl text-snow inline-block"
            style={{ whiteSpace: char === " " ? "pre" : "normal" }}
          >
            {char}
          </motion.span>
        ))}
      </div>

      {/* Sub text */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-slate text-sm"
      >
        {firstName ? `Hey ${firstName}, you're all set!` : "You're all set!"}
      </motion.p>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="space-y-2"
      >
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #10B981, #06B6D4, #6366F1)" }}
            initial={{ width: "0%", boxShadow: "0 0 8px rgba(16,185,129,0.6)" }}
            animate={{ width: "100%", boxShadow: "0 0 16px rgba(6,182,212,0.8)" }}
            transition={{ duration: 1.2, delay: 0.9, ease: "easeInOut" }}
          />
        </div>
        <motion.p
          className="text-xs text-slate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          {"Taking you to dashboard".split("").map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 + i * 0.035 }}
            >
              {ch}
            </motion.span>
          ))}
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 1.9 }}
          >
            …
          </motion.span>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
