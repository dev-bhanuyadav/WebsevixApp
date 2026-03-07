"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { GlowInput } from "@/components/ui/GlowInput";
import { contentContainerVariants, contentItemVariants, charVariants } from "@/lib/animations";

const TITLE = "Welcome back";

interface EmailStepProps {
  onSubmit: (email: string) => void;
  isLoading: boolean;
  error: string | null;
  showContent?: boolean;
}

export function EmailStep({ onSubmit, isLoading, error, showContent = true }: EmailStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputRef.current?.value.trim();
    if (val) onSubmit(val);
  };

  return (
    <motion.div
      variants={contentContainerVariants}
      initial="hidden"
      animate={showContent ? "visible" : "hidden"}
      className="space-y-4"
    >
      {/* Logo icon */}
      <motion.div
        variants={{ hidden: { scale: 0, rotate: -30, opacity: 0 }, visible: { scale: 1, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 280, damping: 18 } } }}
        className="flex justify-center"
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 0 24px rgba(99,102,241,0.4)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 8h18M3 12h12M3 16h9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div variants={contentItemVariants} className="text-center">
        <h1 className="font-display font-bold text-xl text-snow tracking-tight">
          {TITLE.split("").map((char, i) => (
            <motion.span key={i} custom={i} variants={charVariants} className="inline-block" style={{ whiteSpace: char === " " ? "pre" : "normal" }}>
              {char}
            </motion.span>
          ))}
        </h1>
        <p className="text-xs text-slate mt-1">Enter your email to continue</p>
      </motion.div>

      {/* Form */}
      <motion.form onSubmit={handleSubmit} className="space-y-3" variants={contentItemVariants}>
        <GlowInput
          ref={inputRef}
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          required
          error={error ?? undefined}
        />

        <motion.button
          type="submit"
          disabled={isLoading}
          className="relative w-full py-3 rounded-xl font-semibold text-white text-sm overflow-hidden disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 4px 18px rgba(99,102,241,0.28)" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
            animate={{ x: ["-150%","300%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }} />
          <span className="relative z-10">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Checking…
              </span>
            ) : "Continue →"}
          </span>
        </motion.button>
      </motion.form>
    </motion.div>
  );
}
