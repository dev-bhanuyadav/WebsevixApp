"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { GlowInput } from "@/components/ui/GlowInput";
import { contentContainerVariants, contentItemVariants } from "@/lib/animations";
import type { ButtonOrigin } from "./VerifyAnimation";

const schema = z.object({ password: z.string().min(1, "Password is required") });

interface LoginPasswordStepProps {
  email: string;
  firstName: string;
  onSubmit: (password: string, origin: ButtonOrigin) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export function LoginPasswordStep({ email, firstName, onSubmit, onBack, isLoading, error }: LoginPasswordStepProps) {
  const [showPass, setShowPass] = useState(false);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const handleFormSubmit = (d: z.infer<typeof schema>) => {
    const rect = submitBtnRef.current?.getBoundingClientRect();
    const origin: ButtonOrigin = rect
      ? { centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2, top: rect.top, width: rect.width, height: rect.height }
      : { centerX: window.innerWidth / 2, centerY: window.innerHeight * 0.65, top: window.innerHeight * 0.65 - 22, width: 260, height: 44 };
    onSubmit(d.password, origin);
  };

  return (
    <motion.div variants={contentContainerVariants} initial="hidden" animate="visible" className="space-y-4">
      {/* Header */}
      <motion.div variants={contentItemVariants} className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-2"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 className="font-display font-bold text-lg text-snow">
          {firstName ? `Welcome back, ${firstName}!` : "Welcome back!"}
        </h2>
        <p className="text-xs text-slate">{email}</p>
      </motion.div>

      <motion.form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3" variants={contentItemVariants}>
        <div className="relative">
          <GlowInput
            label="Password"
            type={showPass ? "text" : "password"}
            placeholder="Enter your password"
            autoFocus
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <button type="button" onClick={() => setShowPass(p => !p)}
            className="absolute right-3 top-[34px] text-slate hover:text-silver transition-colors" tabIndex={-1}>
            {showPass
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
            }
          </button>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-400 text-center">
            {error}
          </motion.p>
        )}

        <div className="flex gap-2 pt-1">
          <motion.button type="button" onClick={onBack}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate hover:bg-white/[0.04] hover:text-silver text-sm font-medium transition-colors"
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            ← Back
          </motion.button>
          <motion.button ref={submitBtnRef} type="submit" disabled={isLoading}
            className="relative flex-[2] py-2.5 rounded-xl font-semibold text-white text-sm overflow-hidden disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 4px 16px rgba(99,102,241,0.25)" }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent -skew-x-12"
              animate={{ x: ["-150%","300%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }} />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in…</> : "Sign In →"}
            </span>
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}
