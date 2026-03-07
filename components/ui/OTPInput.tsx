"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING_OTP } from "@/lib/animations";
import type { BlastCanvasHandle } from "@/components/auth/BlastCanvas";

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
  /** "idle" | "success" | "error" */
  status?: "idle" | "success" | "error";
  onComplete?: (otp: string) => void;
  canvasRef?: React.RefObject<BlastCanvasHandle>;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  status = "idle",
  onComplete,
  canvasRef,
}: OTPInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const [prevValue, setPrevValue] = useState(value);
  const [flashIdx, setFlashIdx]   = useState<number | null>(null);
  const [shakeBox, setShakeBox]   = useState<number | null>(null);

  // Focus hidden input on container click
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "").slice(0, length);
      const prev = value;
      onChange(raw);

      // Pop animation for newly typed digit
      if (raw.length > prev.length) {
        const idx = raw.length - 1;
        setFlashIdx(idx);
        setTimeout(() => setFlashIdx(null), 300);

        // Tiny ring burst from box
        if (canvasRef?.current && boxRefs.current[idx]) {
          const rect = boxRefs.current[idx]!.getBoundingClientRect();
          canvasRef.current.errorBurst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          );
        }

        // Auto-submit on complete
        if (raw.length === length) {
          onComplete?.(raw);
          // Particle burst between boxes
          if (canvasRef?.current && boxRefs.current[2]) {
            const r = boxRefs.current[2]!.getBoundingClientRect();
            canvasRef.current.explode(r.left + r.width / 2, r.top + r.height / 2);
          }
        }
      } else if (raw.length < prev.length) {
        // Backspace shake
        const idx = raw.length;
        setShakeBox(idx);
        setTimeout(() => setShakeBox(null), 200);
      }

      setPrevValue(raw);
    },
    [value, length, onChange, onComplete, canvasRef]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && value.length === 0) return;
    },
    [value]
  );

  // Keep prevValue in sync when parent resets value
  useEffect(() => {
    if (value === "") setPrevValue("");
  }, [value]);

  const getBoxStyle = (idx: number) => {
    const filled  = idx < value.length;
    const active  = idx === value.length;
    const isFlash = flashIdx === idx;
    const isShake = shakeBox === idx;

    if (status === "error") {
      return {
        border: "1.5px solid #EF4444",
        boxShadow: "0 0 0 3px rgba(239,68,68,0.25), 0 0 14px rgba(239,68,68,0.3)",
        background: "rgba(239,68,68,0.08)",
      };
    }
    if (status === "success") {
      return {
        border: "1.5px solid #10B981",
        boxShadow: "0 0 0 3px rgba(16,185,129,0.25), 0 0 18px rgba(16,185,129,0.35)",
        background: "rgba(16,185,129,0.1)",
      };
    }
    if (isFlash) {
      return {
        border: "1.5px solid #a5b4fc",
        boxShadow: "0 0 0 4px rgba(99,102,241,0.35), 0 0 20px rgba(99,102,241,0.4)",
        background: "rgba(99,102,241,0.18)",
      };
    }
    if (active) {
      return {
        border: "1.5px solid rgba(99,102,241,0.7)",
        boxShadow: "0 0 0 3px rgba(99,102,241,0.18)",
        background: "rgba(99,102,241,0.08)",
      };
    }
    if (filled) {
      return {
        border: "1.5px solid rgba(99,102,241,0.4)",
        boxShadow: "0 0 8px rgba(99,102,241,0.15)",
        background: "rgba(99,102,241,0.07)",
      };
    }
    return {
      border: "1.5px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.03)",
    };
  };

  return (
    <div
      className="relative flex items-center gap-2 cursor-text"
      onClick={focusInput}
    >
      {/* Hidden actual input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={length}
        className="absolute inset-0 opacity-0 w-full h-full cursor-text"
        aria-label="OTP input"
      />

      {/* Visible boxes */}
      {Array.from({ length }).map((_, idx) => {
        const digit   = value[idx] ?? "";
        const isShake = shakeBox === idx;
        const isFlash = flashIdx === idx;

        return (
          <motion.div
            key={idx}
            ref={(el) => { boxRefs.current[idx] = el; }}
            custom={idx}
            variants={{
              hidden: { y: -20, opacity: 0, scale: 0.8 },
              visible: {
                y: 0, opacity: 1, scale: 1,
                transition: { ...SPRING_OTP, delay: idx * 0.06 },
              },
            }}
            initial="hidden"
            animate={
              isShake
                ? {
                    x: [0, -6, 6, -4, 4, 0],
                    scale: [1, 0.92, 0.92, 1],
                    transition: { duration: 0.2, ease: "easeOut" },
                  }
                : isFlash
                ? {
                    scale: [1, 0.82, 1.15, 1.0],
                    transition: SPRING_OTP,
                  }
                : status === "success"
                ? {
                    scale: [1, 1.1, 1],
                    transition: { ...SPRING_OTP, delay: idx * 0.02 },
                  }
                : status === "error"
                ? {
                    x: [0, -10, 10, -8, 8, -4, 4, 0],
                    transition: { duration: 0.4, delay: 0 },
                  }
                : "visible"
            }
            style={{
              ...getBoxStyle(idx),
              width: 48,
              height: 56,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "monospace",
              color: status === "error" ? "#fca5a5" : status === "success" ? "#6ee7b7" : "#f1f5f9",
              transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
              userSelect: "none",
              willChange: "transform",
            }}
          >
            <AnimatePresence mode="wait">
              {digit ? (
                <motion.span
                  key={`d-${idx}-${digit}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.15 }}
                >
                  {digit}
                </motion.span>
              ) : (
                <motion.span
                  key={`empty-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: idx === value.length ? [0.3, 1, 0.3] : 0.15 }}
                  transition={
                    idx === value.length
                      ? { duration: 1.2, repeat: Infinity }
                      : {}
                  }
                  className="w-0.5 h-5 rounded-full bg-current inline-block"
                />
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
