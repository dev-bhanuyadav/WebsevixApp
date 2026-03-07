"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Package, MessageSquare, MapPin, CreditCard, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MilestoneTracker } from "@/components/dashboard/MilestoneTracker";
import type { IOrder, IMilestone } from "@/models/Order";

type Tab = "overview";

interface PublicOrder {
  id: string;
  orderId: string;
  clientId: string;
  title: string;
  status: string;
  aiSummary?: {
    projectType?: string;
    description?: string;
    features?: string[];
    designStyle?: string;
    budget?: string;
    timeline?: string;
    references?: string[];
  };
  milestones: IMilestone[];
  placementFee: number;
  paymentStatus: string;
  paymentId?: string;
  assignedAdmin?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const STATUS_CONFIG = {
  pending_review: { label: "Pending Review", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  in_progress:    { label: "In Progress",    cls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  completed:      { label: "Completed",      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  cancelled:      { label: "Cancelled",      cls: "text-red-400 bg-red-500/10 border-red-500/20" },
};

export default function OrderDetailPage() {
  const { orderId }    = useParams<{ orderId: string }>();
  const searchParams   = useSearchParams();
  const initialTab     = (searchParams.get("tab") as Tab) ?? "overview";
  const router         = useRouter();

  const { accessToken } = useAuth();
  const [order,   setOrder]   = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<Tab>(initialTab);

  // Payment requests
  interface PayReq { _id: string; amount: number; description: string; type: string; status: string; createdAt: string; }
  const [payRequests, setPayRequests] = useState<PayReq[]>([]);
  const [payingId,    setPayingId]    = useState<string | null>(null);
  const [payError,    setPayError]    = useState<string | null>(null);

  const loadPayRequests = useCallback(async (orderId: string) => {
    if (!accessToken) return;
    const res = await fetch(`/api/payments/requests?orderId=${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => null);
    if (!res?.ok) return;
    const d = await res.json() as { requests?: PayReq[] };
    setPayRequests(d.requests ?? []);
  }, [accessToken]);

  const handlePayNow = async (pr: PayReq) => {
    if (!accessToken) return;
    setPayingId(pr._id);
    setPayError(null);
    try {
      // Create Razorpay order for this payment request
      const res = await fetch(`/api/payments/requests/${pr._id}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await res.json() as { success?: boolean; order?: { id: string; amount: number; currency: string; _mock?: boolean }; error?: string };
      if (!d.success || !d.order) { setPayError(d.error ?? "Failed to initiate payment"); setPayingId(null); return; }

      if (d.order._mock) {
        // Mock: mark paid directly
        await fetch(`/api/payments/requests/${pr._id}/verify`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ razorpay_order_id: d.order.id, razorpay_payment_id: "mock_pay", razorpay_signature: "", _mock: true }),
        });
        if (order) loadPayRequests(order.id);
        setPayingId(null);
        return;
      }

      // Real Razorpay checkout
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open(): void } }).Razorpay({
        key:         keyId,
        order_id:    d.order.id,
        amount:      d.order.amount,
        currency:    d.order.currency ?? "INR",
        name:        "Websevix",
        description: pr.description || `${pr.type} payment`,
        image:       "/logo.png",
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const vRes = await fetch(`/api/payments/requests/${pr._id}/verify`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const vd = await vRes.json() as { success?: boolean; error?: string };
          if (vd.success && order) loadPayRequests(order.id);
          else setPayError(vd.error ?? "Verification failed");
          setPayingId(null);
        },
        modal: { ondismiss: () => setPayingId(null) },
        theme: { color: "#6366F1" },
      });
      rzp.open();
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Payment failed");
      setPayingId(null);
    }
  };

  useEffect(() => {
    if (!orderId || !accessToken) return;
    fetch(`/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => {
        setOrder(d.order);
        if (d.order?.id) loadPayRequests(d.order.id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId, accessToken, loadPayRequests]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-10 w-32 rounded-xl bg-white/[0.04] animate-pulse mb-6" />
        <div className="h-48 rounded-2xl bg-white/[0.03] animate-pulse mb-4" />
        <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <Package className="w-12 h-12 text-slate mx-auto mb-4" />
        <p className="text-silver font-medium mb-2">Order not found</p>
        <Link href="/dashboard/client/orders" className="text-indigo-400 text-sm hover:text-indigo-300">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending_review;
  const summary   = order.aiSummary ?? {};
  const completedMs = order.milestones.filter(m => m.status === "completed").length;
  const progressPct = order.milestones.length ? Math.round((completedMs / order.milestones.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/dashboard/client/orders"
          className="inline-flex items-center gap-2 text-sm text-slate hover:text-silver transition-colors">
          <ArrowLeft size={15} /> Back to orders
        </Link>
      </motion.div>

      {/* Order header card */}
      <motion.div
        className="rounded-2xl border border-white/[0.08] p-6"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-mono text-indigo-400">{order.orderId}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.cls}`}>
                {statusCfg.label}
              </span>
            </div>
            <h1 className="font-display font-bold text-xl text-snow">{order.title}</h1>
            <div className="flex flex-wrap gap-4 text-xs text-slate">
              <span>Placed: {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              {summary.budget && <span>Budget: <span className="text-silver">{summary.budget}</span></span>}
              {summary.timeline && <span>Timeline: <span className="text-silver">{summary.timeline}</span></span>}
            </div>
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                <motion.circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="url(#prog)" strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPct} 100`}
                  initial={{ strokeDasharray: "0 100" }}
                  animate={{ strokeDasharray: `${progressPct} 100` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
                <defs>
                  <linearGradient id="prog" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-snow">
                {progressPct}%
              </span>
            </div>
            <div>
              <p className="text-xs text-slate">Overall</p>
              <p className="text-sm font-semibold text-snow">Progress</p>
            </div>
          </div>
        </div>

        {/* AI Summary pills */}
        {(summary.features ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-white/[0.05]">
            {(summary.features ?? []).map(f => (
              <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-300">{f}</span>
            ))}
            {summary.designStyle && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/15 text-violet-300">{summary.designStyle}</span>
            )}
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="flex items-center gap-1 p-1 rounded-xl border border-white/[0.07] w-fit"
        style={{ background: "rgba(255,255,255,0.02)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
      >
        {([["overview", "Overview", Package], ["chat", "Project Chat", MessageSquare]] as const).map(([val, label, Icon]) => (
          <button
            key={val}
            onClick={() => val === "chat" ? router.push(`/dashboard/client/orders/${orderId}/chat`) : setTab(val as Tab)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === val ? "text-snow" : "text-slate hover:text-silver"
            }`}
          >
            {tab === val && (
              <motion.div layoutId="detail-tab" className="absolute inset-0 rounded-lg bg-white/[0.08]"
                transition={{ type: "spring", stiffness: 500, damping: 35 }} />
            )}
            <Icon size={14} className="relative z-10" />
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "overview" ? (
          <motion.div
            key="overview"
            className="space-y-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Project Brief */}
            {summary.description && (
              <div className="rounded-2xl border border-white/[0.07] p-5"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <h2 className="font-display font-semibold text-snow text-sm mb-3 flex items-center gap-2">
                  <MapPin size={15} className="text-indigo-400" /> Project Brief
                </h2>
                <p className="text-sm text-silver leading-relaxed">{summary.description}</p>
              </div>
            )}

            {/* ── Pending Payment Requests ── */}
            {payRequests.filter(pr => pr.status === "pending").length > 0 && (
              <motion.div
                className="rounded-2xl border p-5 space-y-4"
                style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.18)" }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="font-display font-semibold text-amber-300 text-sm flex items-center gap-2">
                  <CreditCard size={15} className="text-amber-400" />
                  Payment Pending
                </h2>

                {payError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                    <AlertCircle size={13} /> {payError}
                  </div>
                )}

                {payRequests.filter(pr => pr.status === "pending").map(pr => (
                  <div
                    key={pr._id}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-snow capitalize">
                        {pr.type} Payment — ₹{pr.amount.toLocaleString("en-IN")}
                      </p>
                      {pr.description && <p className="text-xs text-slate mt-0.5">{pr.description}</p>}
                      <p className="text-[11px] text-slate/60 mt-1">
                        Requested {new Date(pr.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePayNow(pr)}
                      disabled={payingId === pr._id}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all disabled:opacity-60 hover:opacity-90"
                      style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#000" }}
                    >
                      {payingId === pr._id
                        ? <><Loader2 size={13} className="animate-spin" /> Processing…</>
                        : <><CreditCard size={13} /> Pay ₹{pr.amount.toLocaleString("en-IN")}</>
                      }
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Paid requests summary */}
            {payRequests.filter(pr => pr.status === "paid").length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] p-4"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-xs text-slate uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-400" /> Paid Payments
                </p>
                <div className="space-y-2">
                  {payRequests.filter(pr => pr.status === "paid").map(pr => (
                    <div key={pr._id} className="flex items-center justify-between text-sm">
                      <span className="text-silver capitalize">{pr.type} — ₹{pr.amount.toLocaleString("en-IN")}</span>
                      <span className="text-xs text-emerald-400 font-semibold">✓ Paid</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestone tracker */}
            <div className="rounded-2xl border border-white/[0.07] p-5"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <h2 className="font-display font-semibold text-snow text-sm mb-4">Milestone Tracker</h2>
              <MilestoneTracker milestones={order.milestones} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
