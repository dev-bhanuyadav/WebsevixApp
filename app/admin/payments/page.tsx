"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  DollarSign,
  Clock,
  TrendingUp,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type PaymentType = "placement" | "advance" | "milestone" | "final" | "refund";
type PaymentStatus = "paid" | "pending" | "refunded";

interface PaymentClient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface PaymentOrder {
  _id: string;
  orderId: string;
}

interface Payment {
  _id: string;
  paymentId?: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  createdAt: string;
  clientId?: PaymentClient;
  orderId?: PaymentOrder;
  description?: string;
}

interface PaymentStats {
  totalReceived: number;
  thisMonth: number;
  pendingPayments: number;
  placementFees: number;
}

interface PaymentsResponse {
  payments: Payment[];
  total?: number;
  pages?: number;
  page?: number;
  stats?: PaymentStats;
}

const TYPE_CONFIG: Record<PaymentType, { label: string; color: string; bg: string }> = {
  placement: { label: "Placement", color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  advance: { label: "Advance", color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  milestone: { label: "Milestone", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  final: { label: "Final", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  refund: { label: "Refund", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid: { label: "Paid", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  pending: { label: "Pending", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  refunded: { label: "Refunded", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

const PAYMENT_TYPES: { label: string; value: PaymentType }[] = [
  { label: "Advance", value: "advance" },
  { label: "Milestone", value: "milestone" },
  { label: "Final", value: "final" },
  { label: "Placement", value: "placement" },
  { label: "Refund", value: "refund" },
];

function StatMiniCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
        style={{ background: iconBg }}
      >
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-xs text-slate uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold font-display text-snow">{value}</p>
      </div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const { accessToken } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalReceived: 0,
    thisMonth: 0,
    pendingPayments: 0,
    placementFees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Create request form
  const [showForm, setShowForm] = useState(false);
  const [formOrderId, setFormOrderId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<PaymentType>("advance");
  const [formDueDate, setFormDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const fetchPayments = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", String(page));

    fetch(`/api/admin/payments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: PaymentsResponse) => {
        setPayments(d.payments ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
        if (d.stats) setStats(d.stats);
        else {
          // Compute from payments if not provided
          const paid = (d.payments ?? []).filter((p) => p.status === "paid");
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisMonthPaid = paid.filter((p) => new Date(p.createdAt) >= startOfMonth);
          const pending = (d.payments ?? []).filter((p) => p.status === "pending");
          const placement = paid.filter((p) => p.type === "placement");
          setStats({
            totalReceived: paid.reduce((s, p) => s + p.amount, 0),
            thisMonth: thisMonthPaid.reduce((s, p) => s + p.amount, 0),
            pendingPayments: pending.reduce((s, p) => s + p.amount, 0),
            placementFees: placement.reduce((s, p) => s + p.amount, 0),
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleCreateRequest = async () => {
    if (!accessToken) return;
    if (!formOrderId.trim() || !formAmount) {
      setCreateResult({ ok: false, msg: "Order ID and amount are required." });
      return;
    }
    setCreating(true);
    setCreateResult(null);
    try {
      const res = await fetch("/api/admin/payments/request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: formOrderId.trim(),
          amount: parseFloat(formAmount),
          description: formDescription || undefined,
          type: formType,
          dueDate: formDueDate || undefined,
        }),
      });
      const d = (await res.json()) as { success?: boolean; error?: string };
      if (d.success) {
        setCreateResult({ ok: true, msg: "Payment request created!" });
        setFormOrderId("");
        setFormAmount("");
        setFormDescription("");
        setFormType("advance");
        setFormDueDate("");
        fetchPayments();
      } else {
        setCreateResult({ ok: false, msg: d.error ?? "Failed to create" });
      }
    } catch {
      setCreateResult({ ok: false, msg: "Network error" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-snow">Payments</h1>
        <p className="text-sm text-slate mt-0.5">Track all payments and create requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatMiniCard
          label="Total Received"
          value={`₹${stats.totalReceived.toLocaleString("en-IN")}`}
          icon={DollarSign}
          iconColor="#10B981"
          iconBg="rgba(16,185,129,0.12)"
        />
        <StatMiniCard
          label="This Month"
          value={`₹${stats.thisMonth.toLocaleString("en-IN")}`}
          icon={TrendingUp}
          iconColor="#22D3EE"
          iconBg="rgba(34,211,238,0.12)"
        />
        <StatMiniCard
          label="Pending"
          value={`₹${stats.pendingPayments.toLocaleString("en-IN")}`}
          icon={Clock}
          iconColor="#F59E0B"
          iconBg="rgba(245,158,11,0.12)"
        />
        <StatMiniCard
          label="Placement Fees"
          value={`₹${stats.placementFees.toLocaleString("en-IN")}`}
          icon={CreditCard}
          iconColor="#A78BFA"
          iconBg="rgba(167,139,250,0.12)"
        />
      </div>

      {/* Create payment request */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{ background: "rgba(99,102,241,0.16)" }}
            >
              <Plus size={14} style={{ color: "#818CF8" }} />
            </div>
            <span className="text-sm font-semibold text-snow">Create Payment Request</span>
          </div>
          <motion.div animate={{ rotate: showForm ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus size={16} className="text-slate" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                className="px-5 pb-5 pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-slate mb-1.5 block">Order ID / DB ID</label>
                    <input
                      type="text"
                      placeholder="Order _id or orderId"
                      value={formOrderId}
                      onChange={(e) => setFormOrderId(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate mb-1.5 block">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate mb-1.5 block">Type</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as PaymentType)}
                      className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none appearance-none cursor-pointer"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                      }}
                    >
                      {PAYMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value} style={{ background: "#0d0d18" }}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate mb-1.5 block">Due Date (optional)</label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        colorScheme: "dark",
                      }}
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="text-xs text-slate mb-1.5 block">Description (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Milestone 2 payment"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                      }}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {createResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mb-4 ${
                        createResult.ok
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          : "text-red-400 bg-red-500/10 border border-red-500/20"
                      }`}
                    >
                      {createResult.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {createResult.msg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCreateRequest}
                    disabled={creating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff" }}
                  >
                    {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Create Request
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate hover:text-snow transition-colors"
                  >
                    <X size={13} />
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payments table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Payment ID", "Client", "Order", "Type", "Amount", "Status", "Date"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div
                          className="h-4 rounded animate-pulse"
                          style={{ background: "rgba(255,255,255,0.07)" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <CreditCard size={36} className="text-slate" />
                      <p className="text-sm text-slate">No payments yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((p, idx) => {
                  const typeCfg = TYPE_CONFIG[p.type] ?? TYPE_CONFIG.advance;
                  const statusCfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
                  return (
                    <motion.tr
                      key={p._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: idx * 0.04 }}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-slate">
                          {p.paymentId ?? p._id.slice(-8)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-silver text-xs">
                        {p.clientId
                          ? `${p.clientId.firstName} ${p.clientId.lastName}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {p.orderId ? (
                          <span className="font-mono text-xs" style={{ color: "#818CF8" }}>
                            #{p.orderId.orderId}
                          </span>
                        ) : (
                          <span className="text-slate text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: typeCfg.bg, color: typeCfg.color }}
                        >
                          {typeCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-snow text-sm font-semibold">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: statusCfg.bg, color: statusCfg.color }}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate text-xs whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-xs text-slate">
              Page {page} of {pages} · {total} payments
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "#CBD5E1",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <ChevronLeft size={13} />
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "#CBD5E1",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
