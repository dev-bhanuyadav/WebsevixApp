"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { GlowInput } from "@/components/ui/GlowInput";
import { contentContainerVariants, contentItemVariants } from "@/lib/animations";
import type { RegisterData } from "@/hooks/useAuthFlow";
import type { ButtonOrigin } from "./VerifyAnimation";

const schema = z.object({
  firstName:       z.string().min(2, "Min 2 chars").max(50).trim(),
  lastName:        z.string().min(2, "Min 2 chars").max(50).trim(),
  phone:           z.string().min(5, "Enter phone").max(25).trim(),
  password:        z.string().min(8, "Min 8 characters").max(72),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type FormData = z.infer<typeof schema>;

interface SignupFormStepProps {
  email: string;
  onSubmit: (data: RegisterData, origin: ButtonOrigin) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

const EyeIcon = ({ visible }: { visible: boolean }) => visible ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export function SignupFormStep({ email, onSubmit, onBack, isLoading, error }: SignupFormStepProps) {
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleFormSubmit = (data: FormData) => {
    const rect = submitBtnRef.current?.getBoundingClientRect();
    const origin: ButtonOrigin = rect
      ? { centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2, top: rect.top, width: rect.width, height: rect.height }
      : { centerX: window.innerWidth / 2, centerY: window.innerHeight * 0.65, top: window.innerHeight * 0.65 - 22, width: 260, height: 44 };
    onSubmit({ ...data, email, role: "client" }, origin);
  };

  return (
    <motion.div variants={contentContainerVariants} initial="hidden" animate="visible" className="space-y-3">
      {/* Header */}
      <motion.div variants={contentItemVariants} className="text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
        <h2 className="font-display font-bold text-lg text-snow">Create your account</h2>
        <p className="text-xs text-slate mt-0.5">{email}</p>
      </motion.div>

      <motion.form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-2.5" variants={contentItemVariants}>
        {/* Name row */}
        <div className="grid grid-cols-2 gap-2">
          <GlowInput label="First name" placeholder="John" autoFocus error={errors.firstName?.message} {...register("firstName")} />
          <GlowInput label="Last name" placeholder="Doe" error={errors.lastName?.message} {...register("lastName")} />
        </div>

        {/* Phone */}
        <GlowInput label="Phone" type="tel" placeholder="+91 98765 43210" error={errors.phone?.message} {...register("phone")} />

        {/* Password */}
        <div className="relative">
          <GlowInput label="Password" type={showPass ? "text" : "password"} placeholder="Min 8 characters"
            autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <button type="button" onClick={() => setShowPass(p => !p)}
            className="absolute right-3 top-[34px] text-slate hover:text-silver transition-colors" tabIndex={-1}>
            <EyeIcon visible={showPass} />
          </button>
        </div>

        {/* Confirm */}
        <div className="relative">
          <GlowInput label="Confirm password" type={showConfirm ? "text" : "password"} placeholder="Repeat password"
            autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          <button type="button" onClick={() => setShowConfirm(p => !p)}
            className="absolute right-3 top-[34px] text-slate hover:text-silver transition-colors" tabIndex={-1}>
            <EyeIcon visible={showConfirm} />
          </button>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400 text-center">{error}</motion.p>
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
              {isLoading ? (
                <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating…</>
              ) : "Create Account →"}
            </span>
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}
