"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ExternalLink } from "lucide-react";

export interface OrderToast {
  id: string;
  orderId: string;
  orderDbId: string;
  clientName: string;
  projectType: string;
  budget?: string;
  amount: number;
}

interface NewOrderToastContextValue {
  addToast: (toast: OrderToast) => void;
}

const NewOrderToastContext = createContext<NewOrderToastContextValue | null>(null);

export function useNewOrderToast(): NewOrderToastContextValue {
  const ctx = useContext(NewOrderToastContext);
  if (!ctx) throw new Error("useNewOrderToast must be used within NewOrderToastProvider");
  return ctx;
}

const MAX_TOASTS = 4;
const DURATION_MS = 8000;

// ─── Individual toast item ─────────────────────────────────────────────────

interface ToastItemProps {
  toast: OrderToast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(100);

  const remainingRef = useRef(DURATION_MS);
  const startTimeRef = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const dismissedRef = useRef(false);

  const stopRAF = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();

    const tick = () => {
      if (pausedRef.current || dismissedRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = remainingRef.current - elapsed;

      if (remaining <= 0) {
        setProgress(0);
        if (!dismissedRef.current) {
          dismissedRef.current = true;
          onDismiss(toast.id);
        }
        return;
      }

      setProgress((remaining / DURATION_MS) * 100);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    startTimer();
    return () => {
      dismissedRef.current = true;
      stopRAF();
    };
  }, [startTimer, stopRAF]);

  const handleMouseEnter = () => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    stopRAF();
  };

  const handleMouseLeave = () => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    startTimer();
  };

  const handleDismiss = () => {
    dismissedRef.current = true;
    stopRAF();
    onDismiss(toast.id);
  };

  const handleView = () => {
    router.push(`/admin/orders/${toast.orderDbId}`);
    handleDismiss();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.93 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-80 rounded-2xl overflow-hidden"
      style={{
        background: "rgba(10,10,20,0.96)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 24px rgba(99,102,241,0.12)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {/* Icon + pulse dot */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: "rgba(99,102,241,0.16)" }}
          >
            <ShoppingBag size={16} style={{ color: "#818CF8" }} />
          </div>
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 animate-pulse"
            style={{
              background: "#EF4444",
              borderColor: "rgba(10,10,20,0.96)",
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-bold text-snow">New Order!</span>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-0.5 rounded-md text-slate hover:text-snow hover:bg-white/10 transition-all"
            >
              <X size={13} />
            </button>
          </div>

          <p className="text-xs font-mono mb-0.5" style={{ color: "#818CF8" }}>
            #{toast.orderId}
          </p>
          <p className="text-xs text-silver leading-relaxed">
            <span className="font-semibold text-snow">{toast.clientName}</span>
            {" · "}
            {toast.projectType}
          </p>
          {toast.budget && (
            <p className="text-xs text-slate mt-0.5">Budget: {toast.budget}</p>
          )}
          <p className="text-xs mt-1">
            <span className="font-semibold" style={{ color: "#10B981" }}>
              ₹{toast.amount.toLocaleString("en-IN")} paid
            </span>{" "}
            <span>✅</span>
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="flex items-center gap-2 px-4 pb-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={handleView}
          className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)" }}
        >
          <ExternalLink size={11} />
          View Order
        </button>
        <button
          onClick={handleDismiss}
          className="flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate hover:text-snow hover:bg-white/8 transition-all"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          Dismiss
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 rounded-full transition-none"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #6366F1, rgba(99,102,241,0.3))",
        }}
      />
    </motion.div>
  );
}

// ─── Toast renderer ────────────────────────────────────────────────────────

let _addToast: ((toast: OrderToast) => void) | null = null;

export function NewOrderToast() {
  const [toasts, setToasts] = useState<OrderToast[]>([]);

  const addToast = useCallback((toast: OrderToast) => {
    setToasts((prev) => {
      const updated = [...prev, toast];
      // Keep max 4, remove oldest
      return updated.slice(-MAX_TOASTS);
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Expose addToast globally so the context provider can reach it
  useEffect(() => {
    _addToast = addToast;
    return () => {
      _addToast = null;
    };
  }, [addToast]);

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Provider ──────────────────────────────────────────────────────────────

export function NewOrderToastProvider({ children }: { children: React.ReactNode }) {
  const addToast = useCallback((toast: OrderToast) => {
    if (_addToast) _addToast(toast);
  }, []);

  return (
    <NewOrderToastContext.Provider value={{ addToast }}>
      {children}
      <NewOrderToast />
    </NewOrderToastContext.Provider>
  );
}
