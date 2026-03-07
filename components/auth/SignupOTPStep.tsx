"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { OTPInput } from "@/components/ui/OTPInput";
import { contentContainerVariants, contentItemVariants } from "@/lib/animations";
import type { BlastCanvasHandle } from "@/components/auth/BlastCanvas";

interface SignupOTPStepProps {
  email: string;
  onSubmit: (otp: string) => void;
  onResend: () => void;
  isLoading: boolean;
  error: string | null;
  resendCooldown: number;
  canResend: boolean;
  canvasRef?: React.RefObject<BlastCanvasHandle>;
}

export function SignupOTPStep({
  email,
  onSubmit,
  onResend,
  isLoading,
  error,
  resendCooldown,
  canResend,
  canvasRef,
}: SignupOTPStepProps) {
  const [otp, setOtp] = useState("");
  const otpStatus = error ? "error" : otp.length === 6 && !error ? "success" : "idle";

  return (
    <motion.div
      variants={contentContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={contentItemVariants} className="text-center space-y-1">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
          style={{
            background: "linear-gradient(135deg,#8B5CF6,#06B6D4)",
            boxShadow: "0 0 24px rgba(139,92,246,0.4)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="white" strokeWidth="2" />
            <polyline points="22,6 12,13 2,6" stroke="white" strokeWidth="2" />
          </svg>
        </div>
        <h2 className="font-display font-bold text-xl text-snow">Almost there!</h2>
        <p className="text-sm text-slate">
          Verify your email <span className="text-silver font-medium">{email}</span>
        </p>
      </motion.div>

      {/* OTP */}
      <motion.div variants={contentItemVariants} className="flex justify-center">
        <OTPInput
          value={otp}
          onChange={setOtp}
          length={6}
          disabled={isLoading}
          status={otpStatus}
          onComplete={onSubmit}
          canvasRef={canvasRef}
        />
      </motion.div>

      {/* Error */}
      <motion.div variants={contentItemVariants} className="min-h-[20px]">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 text-center"
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      {/* Submit */}
      <motion.div variants={contentItemVariants}>
        <motion.button
          type="button"
          onClick={() => otp.length === 6 && onSubmit(otp)}
          disabled={otp.length !== 6 || isLoading}
          className="relative w-full py-3.5 rounded-xl font-semibold text-white overflow-hidden disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
            boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
            animate={{ x: ["-150%", "300%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          />
          <span className="relative z-10">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account…
              </span>
            ) : "Create Account →"}
          </span>
        </motion.button>
      </motion.div>

      {/* Resend */}
      <motion.div variants={contentItemVariants} className="text-center">
        {canResend ? (
          <button
            type="button"
            onClick={onResend}
            disabled={isLoading}
            className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Resend code
          </button>
        ) : (
          <span className="text-sm text-slate">
            Resend in{" "}
            <motion.span
              key={resendCooldown}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-silver tabular-nums"
            >
              {resendCooldown}s
            </motion.span>
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
