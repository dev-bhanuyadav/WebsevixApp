"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CreditCard,
  User,
  Mail,
  Calendar,
  DollarSign,
  Clock,
  Tag,
  Palette,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type OrderStatus = "pending_review" | "in_progress" | "completed" | "cancelled";

const STATUS: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  pending_review: {
    label: "Pending Review",
    cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-400",
  },
  in_progress: {
    label: "In Progress",
    cls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    dot: "bg-cyan-400 animate-pulse",
  },
  completed: {
    label: "Completed",
    cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    cls: "text-red-400 bg-red-500/10 border-red-500/20",
    dot: "bg-red-400",
  },
};

interface Milestone {
  _id?: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  order: number;
}

interface OrderClient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

interface Order {
  _id: string;
  orderId: string;
  title?: string;
  status: OrderStatus;
  budget?: string;
  paymentStatus?: string;
  placementFee?: number;
  createdAt: string;
  clientId: OrderClient | null;
  milestones?: Milestone[];
  aiSummary?: {
    projectType?: string;
    description?: string;
    features?: string[];
    designStyle?: string;
    timeline?: string;
    referenceLinks?: string[];
  };
}

interface MilestoneInput {
  title: string;
  amount: string;
  days: string;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS[status] ?? STATUS.pending_review;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-slate mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-slate uppercase tracking-wider">{label}</p>
        <p className="text-sm text-silver mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { accessToken } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Accept form state
  const [quoteTitle, setQuoteTitle] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [advance, setAdvance] = useState("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", amount: "", days: "" },
  ]);
  const [quoteMessage, setQuoteMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Reject form state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Milestone actions
  const [milestoneLoading, setMilestoneLoading] = useState<string | null>(null);

  // Request payment panel
  const [payAmount, setPayAmount] = useState("");
  const [payDesc, setPayDesc] = useState("");
  const [payType, setPayType] = useState<"advance" | "milestone" | "final">("advance");
  const [sendingPay, setSendingPay] = useState(false);
  const [payResult, setPayResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Existing payment requests list
  interface PayReq { _id: string; amount: number; description: string; type: string; status: string; createdAt: string; }
  const [payRequests, setPayRequests] = useState<PayReq[]>([]);

  const loadPayRequests = async () => {
    if (!accessToken || !order) return;
    const res = await fetch(`/api/payments/requests?orderId=${order._id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => null);
    if (!res?.ok) return;
    const d = await res.json() as { requests?: PayReq[] };
    setPayRequests(d.requests ?? []);
  };

  const sendPaymentRequest = async () => {
    if (!accessToken || !order || !payAmount) return;
    setSendingPay(true);
    setPayResult(null);
    try {
      const res = await fetch("/api/admin/payments/request", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId:   order._id,
          clientId:  order.clientId == null ? "" : (typeof order.clientId === "object" ? order.clientId._id : order.clientId),
          amount:    parseFloat(payAmount),
          description: payDesc.trim() || `${payType.charAt(0).toUpperCase() + payType.slice(1)} payment`,
          type:      payType,
        }),
      });
      const d = await res.json() as { success?: boolean; error?: string };
      if (d.success) {
        setPayResult({ ok: true, msg: "Payment request sent to client!" });
        setPayAmount(""); setPayDesc("");
        loadPayRequests();
      } else {
        setPayResult({ ok: false, msg: d.error ?? "Failed to send" });
      }
    } catch {
      setPayResult({ ok: false, msg: "Network error" });
    } finally {
      setSendingPay(false);
    }
  };

  useEffect(() => {
    if (!accessToken || !orderId) return;
    setLoading(true);
    fetch(`/api/admin/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: { order?: Order; error?: string }) => {
        if (d.error) setError(d.error);
        else if (d.order) setOrder(d.order);
      })
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false));
  }, [accessToken, orderId]);

  // Load payment requests whenever order is set
  useEffect(() => { if (order) loadPayRequests(); }, [order?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: quoteTitle || undefined,
          totalCost: totalCost ? parseFloat(totalCost) : undefined,
          advance: advance ? parseFloat(advance) : undefined,
          milestones: milestones
            .filter((m) => m.title.trim())
            .map((m) => ({
              title: m.title,
              amount: m.amount ? parseFloat(m.amount) : undefined,
              estimatedDays: m.days ? parseInt(m.days, 10) : undefined,
            })),
          message: quoteMessage || undefined,
        }),
      });
      const data = (await res.json()) as { success?: boolean; order?: Order; error?: string };
      if (data.success && data.order) {
        setOrder(data.order);
        setSubmitResult({ ok: true, msg: "Order accepted and moved to In Progress!" });
      } else {
        setSubmitResult({ ok: false, msg: data.error ?? "Failed to accept order" });
      }
    } catch {
      setSubmitResult({ ok: false, msg: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!accessToken) return;
    setRejecting(true);
    try {
      await fetch(`/api/admin/orders/${orderId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = (await res.json()) as { order?: Order };
      if (d.order) setOrder(d.order);
      setShowRejectForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setRejecting(false);
    }
  };

  const handleMilestoneComplete = async (milestoneId: string) => {
    if (!accessToken || !order) return;
    setMilestoneLoading(milestoneId);
    const updatedMilestones = (order.milestones ?? []).map((m) =>
      m._id === milestoneId ? { ...m, status: "completed" as const } : m
    );
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ milestones: updatedMilestones }),
      });
      const d = (await res.json()) as { order?: Order };
      if (d.order) setOrder(d.order);
    } catch (err) {
      console.error(err);
    } finally {
      setMilestoneLoading(null);
    }
  };

  const addMilestone = () =>
    setMilestones((prev) => [...prev, { title: "", amount: "", days: "" }]);

  const removeMilestone = (i: number) =>
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));

  const updateMilestone = (i: number, field: keyof MilestoneInput, value: string) =>
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  const advancePercent =
    totalCost && advance
      ? ((parseFloat(advance) / parseFloat(totalCost)) * 100).toFixed(0)
      : null;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-64 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-silver text-sm">{error || "Order not found"}</p>
        <Link href="/admin/orders">
          <button className="text-xs text-indigo-400 hover:underline">← Back to Orders</button>
        </Link>
      </div>
    );
  }

  const client = order.clientId;
  const clientFullName = client ? `${client.firstName} ${client.lastName}` : "Unknown Client";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-6xl"
    >
      {/* Back button */}
      <Link href="/admin/orders">
        <button className="flex items-center gap-2 text-sm text-slate hover:text-snow transition-colors">
          <ArrowLeft size={15} />
          Back to Orders
        </button>
      </Link>

      {/* Header card */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl font-mono font-bold" style={{ color: "#818CF8" }}>
                #{order.orderId}
              </span>
              <StatusBadge status={order.status} />
            </div>
            {order.title && (
              <h1 className="text-lg font-semibold text-snow mt-1">{order.title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {order.paymentStatus === "paid" && (
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  color: "#10B981",
                  border: "1px solid rgba(16,185,129,0.22)",
                }}
              >
                <CreditCard size={12} />
                ₹{order.placementFee ?? 500} Placement Fee ✅ Paid
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Client info */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p className="text-xs font-semibold text-slate uppercase tracking-wider">Client</p>
            <InfoRow icon={User} label="Name" value={clientFullName} />
            <InfoRow icon={Mail} label="Email" value={client?.email ?? "—"} />
            {client?.phone && <InfoRow icon={CreditCard} label="Phone" value={client.phone} />}
          </div>

          {/* AI Summary */}
          {order.aiSummary && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <p className="text-xs font-semibold text-slate uppercase tracking-wider">Project Info</p>
              {order.aiSummary.projectType && (
                <InfoRow icon={Tag} label="Type" value={order.aiSummary.projectType} />
              )}
              {order.aiSummary.designStyle && (
                <InfoRow icon={Palette} label="Design Style" value={order.aiSummary.designStyle} />
              )}
              {order.aiSummary.timeline && (
                <InfoRow icon={Clock} label="Timeline" value={order.aiSummary.timeline} />
              )}
            </div>
          )}

          {/* Budget & Date */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p className="text-xs font-semibold text-slate uppercase tracking-wider">Details</p>
            {order.budget && <InfoRow icon={DollarSign} label="Budget" value={order.budget} />}
            <InfoRow
              icon={Calendar}
              label="Created"
              value={new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
          </div>
        </div>

        {/* Description */}
        {order.aiSummary?.description && (
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">
              Project Description
            </p>
            <p className="text-sm text-silver leading-relaxed">{order.aiSummary.description}</p>
          </div>
        )}

        {/* Features */}
        {order.aiSummary?.features && order.aiSummary.features.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">
              Required Features
            </p>
            <div className="flex flex-wrap gap-1.5">
              {order.aiSummary.features.map((f, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    color: "#A5B4FC",
                    border: "1px solid rgba(99,102,241,0.18)",
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reference links */}
        {order.aiSummary?.referenceLinks && order.aiSummary.referenceLinks.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">
              References
            </p>
            <div className="flex flex-col gap-1">
              {order.aiSummary.referenceLinks.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:underline"
                >
                  <Link2 size={11} />
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* In-progress: Milestone tracker */}
      {order.status === "in_progress" && order.milestones && order.milestones.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div
            className="lg:col-span-2 rounded-2xl p-5"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <h3 className="text-sm font-semibold font-display text-snow mb-4">Milestone Tracker</h3>
            <div className="space-y-3">
              {order.milestones.map((m, idx) => (
                <div
                  key={m._id ?? idx}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background:
                      m.status === "completed"
                        ? "rgba(16,185,129,0.06)"
                        : "rgba(255,255,255,0.03)",
                    border:
                      m.status === "completed"
                        ? "1px solid rgba(16,185,129,0.15)"
                        : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {m.status === "completed" ? (
                    <CheckCircle2 size={18} style={{ color: "#10B981" }} className="flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-slate flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: m.status === "completed" ? "#34D399" : "#F8FAFC",
                        textDecoration: m.status === "completed" ? "line-through" : "none",
                      }}
                    >
                      {m.title}
                    </p>
                    {m.description && (
                      <p className="text-xs text-slate mt-0.5">{m.description}</p>
                    )}
                  </div>
                  {m.status !== "completed" && m._id && (
                    <button
                      onClick={() => handleMilestoneComplete(m._id!)}
                      disabled={milestoneLoading === m._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                      style={{
                        background: "rgba(16,185,129,0.12)",
                        color: "#10B981",
                        border: "1px solid rgba(16,185,129,0.22)",
                      }}
                    >
                      {milestoneLoading === m._id ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={11} />
                      )}
                      Mark Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <h3 className="text-sm font-semibold font-display text-snow">Quick Actions</h3>
            <Link href={`/admin/messages/${order._id}`}>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                style={{
                  background: "rgba(99,102,241,0.16)",
                  color: "#A5B4FC",
                  border: "1px solid rgba(99,102,241,0.22)",
                }}
              >
                Open Chat
              </button>
            </Link>
            <button
              onClick={async () => {
                if (!accessToken) return;
                await fetch(`/api/admin/orders/${orderId}`, {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ status: "completed" }),
                });
                const res = await fetch(`/api/admin/orders/${orderId}`, {
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
                const d = (await res.json()) as { order?: Order };
                if (d.order) setOrder(d.order);
              }}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{
                background: "rgba(16,185,129,0.12)",
                color: "#10B981",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              Mark Order Complete
            </button>
          </div>

          {/* ── Request Payment from Client ── */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <h3 className="text-sm font-semibold font-display text-snow flex items-center gap-2">
              <CreditCard size={15} className="text-indigo-400" />
              Request Payment
            </h3>

            {/* Type selector */}
            <div className="flex gap-2">
              {(["advance", "milestone", "final"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setPayType(t)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                  style={{
                    background: payType === t ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                    border:     payType === t ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.07)",
                    color:      payType === t ? "#A5B4FC" : "#64748B",
                  }}
                >{t}</button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Amount (₹)"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={payDesc}
              onChange={e => setPayDesc(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
            />

            <AnimatePresence>
              {payResult && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`text-xs font-medium px-3 py-2 rounded-lg ${payResult.ok ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}
                >{payResult.msg}</motion.p>
              )}
            </AnimatePresence>

            <button
              onClick={sendPaymentRequest}
              disabled={sendingPay || !payAmount}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#6366F1,#4F46E5)", color: "#fff" }}
            >
              {sendingPay ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
              Send Payment Request
            </button>

            {/* Existing requests */}
            {payRequests.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                <p className="text-[11px] text-slate uppercase tracking-wider">Sent Requests</p>
                {payRequests.map(pr => (
                  <div key={pr._id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <p className="text-xs font-medium text-snow capitalize">{pr.type} — ₹{pr.amount.toLocaleString("en-IN")}</p>
                      {pr.description && <p className="text-[11px] text-slate">{pr.description}</p>}
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      pr.status === "paid" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                    }`}>{pr.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending review: Quote & Accept panel */}
      {order.status === "pending_review" && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <h3 className="text-sm font-semibold font-display text-snow mb-5">Quote &amp; Accept</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate mb-1.5 block">Project Title</label>
              <input
                type="text"
                placeholder="e.g. E-Commerce Website"
                value={quoteTitle}
                onChange={(e) => setQuoteTitle(e.target.value)}
                className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              />
            </div>
            <div>
              <label className="text-xs text-slate mb-1.5 block">Total Cost (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              />
            </div>
            <div>
              <label className="text-xs text-slate mb-1.5 block">
                Advance (₹)
                {advancePercent && (
                  <span className="ml-2 text-indigo-400">({advancePercent}%)</span>
                )}
              </label>
              <input
                type="number"
                placeholder="0"
                value={advance}
                onChange={(e) => setAdvance(e.target.value)}
                className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              />
            </div>
          </div>

          {/* Milestones */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate">Milestone Breakdown</label>
              <button
                onClick={addMilestone}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus size={12} />
                Add Row
              </button>
            </div>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Milestone title"
                    value={m.title}
                    onChange={(e) => updateMilestone(i, "title", e.target.value)}
                    className="flex-1 px-3 py-2 text-xs text-snow rounded-lg outline-none placeholder:text-slate"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="₹"
                    value={m.amount}
                    onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                    className="w-24 px-3 py-2 text-xs text-snow rounded-lg outline-none placeholder:text-slate"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Days"
                    value={m.days}
                    onChange={(e) => updateMilestone(i, "days", e.target.value)}
                    className="w-20 px-3 py-2 text-xs text-snow rounded-lg outline-none placeholder:text-slate"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  {milestones.length > 1 && (
                    <button onClick={() => removeMilestone(i)} className="text-slate hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="mb-5">
            <label className="text-xs text-slate mb-1.5 block">Message to Client (optional)</label>
            <textarea
              rows={3}
              placeholder="E.g. Thank you for your order! Here's our quote..."
              value={quoteMessage}
              onChange={(e) => setQuoteMessage(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate resize-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            />
          </div>

          {/* Submit result */}
          <AnimatePresence>
            {submitResult && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mb-4 ${
                  submitResult.ok
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-red-400 bg-red-500/10 border border-red-500/20"
                }`}
              >
                {submitResult.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {submitResult.msg}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleAccept}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff" }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Send Quote &amp; Accept
            </button>
            <button
              onClick={() => setShowRejectForm((v) => !v)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#EF4444",
                border: "1px solid rgba(239,68,68,0.22)",
              }}
            >
              Reject Order
            </button>
          </div>

          {/* Reject form */}
          <AnimatePresence>
            {showRejectForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.16)",
                  }}
                >
                  <label className="text-xs text-red-400 mb-1.5 block font-semibold">
                    Rejection Reason
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Please explain why this order is being rejected..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl outline-none placeholder:text-slate resize-none mb-3"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(239,68,68,0.18)",
                      color: "#F8FAFC",
                    }}
                  />
                  <button
                    onClick={handleReject}
                    disabled={rejecting || !rejectReason.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    style={{
                      background: "rgba(239,68,68,0.18)",
                      color: "#EF4444",
                      border: "1px solid rgba(239,68,68,0.3)",
                    }}
                  >
                    {rejecting ? <Loader2 size={13} className="animate-spin" /> : null}
                    Confirm Rejection
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
