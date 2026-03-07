"use client";

import { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SafeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | "onDrag" | "onDragEnd" | "onDragEnter" | "onDragExit"
  | "onDragLeave" | "onDragOver" | "onDragStart" | "onAnimationStart"
>;

interface GlowInputProps extends SafeInputProps {
  label: string;
  error?: string;
}

export const GlowInput = forwardRef<HTMLInputElement, GlowInputProps>(
  ({ label, error, className = "", disabled, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div className="w-full">
        <motion.label
          className="block text-xs font-medium mb-1 transition-colors duration-300"
          animate={{ color: focused ? "#a5b4fc" : "#94a3b8" }}
        >
          {label}
        </motion.label>

        <div className="relative">
          {/* Idle glow pulse ring */}
          {!focused && !error && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              animate={{
                boxShadow: [
                  "0 0 0 1px rgba(99,102,241,0.1)",
                  "0 0 0 1px rgba(99,102,241,0.3)",
                  "0 0 0 1px rgba(99,102,241,0.1)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <motion.input
            ref={ref}
            className={`
              w-full px-3.5 py-2.5 rounded-xl text-sm text-snow placeholder-slate/50
              focus:outline-none transition-all duration-300 bg-white/[0.04]
              ${error ? "border-red-500/50" : "border-white/10"}
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              border
              ${className}
            `}
            style={{ willChange: "box-shadow" }}
            animate={
              error
                ? { boxShadow: "0 0 0 3px rgba(239,68,68,0.3), 0 0 12px rgba(239,68,68,0.15)" }
                : focused
                ? { boxShadow: "0 0 0 3px rgba(99,102,241,0.2), 0 0 16px rgba(99,102,241,0.15)" }
                : { boxShadow: "0 0 0 1px rgba(99,102,241,0.0)" }
            }
            transition={{ duration: 0.25 }}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />

          {/* Shimmer sweep on focus */}
          <AnimatePresence>
            {focused && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "300%" }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-1.5 text-xs text-red-400"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

GlowInput.displayName = "GlowInput";
