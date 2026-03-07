"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, CreditCard, CheckCircle2, XCircle, Clock, AlertTriangle,
  FileText, Loader2, X, Ticket,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { RaiseTicketModal } from "@/components/tickets/RaiseTicketModal";

type SubStatus = "pending_acceptance" | "active" | "paused" | "cancelled" | "rejected";
type InvoiceStatus = "draft" | "sent" | "paid" | "failed" | "refunded";

interface PopulatedService {
  _id: string; name: string; description?: string; category: string;
  icon?: string; basePrice: number; billingCycle: string;
  features: string[]; isMandatory: boolean;
}
interface ClientSub {
  _id: string; serviceId: PopulatedService; customPrice?: number | null;
  status: SubStatus; isMandatory: boolean; isDue?: boolean;
  nextBillingDate?: string; billingStartDate?: string; createdAt: string;
}
interface IInvoice {
  _id: string; invoiceNo: string; month: string; total: number;
  status: InvoiceStatus; lineItems: { serviceName: string; price: number }[];
  paidAt?: string; createdAt: string;
}

const STATUS_CFG: Record<SubStatus, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  pending_acceptance: { icon: <Clock size={12} />,         label: "Awaiting Response", color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
  active:             { icon: <CheckCircle2 size={12} />,  label: "Active",            color: "#34D399", bg: "rgba(52,211,153,0.1)" },
  paused:             { icon: <AlertTriangle size={12} />, label: "Paused",            color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  cancelled:          { icon: <XCircle size={12} />,       label: "Cancelled",         color: "#F87171", bg: "rgba(248,113,113,0.1)" },
  rejected:           { icon: <XCircle size={12} />,       label: "Rejected",           color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

const INV_CFG: Record<InvoiceStatus, { label: string; color: string }> = {
  draft:    { label: "Draft",    color: "#64748B" },
  sent:     { label: "Due",      color: "#FBBF24" },
  paid:     { label: "Paid",     color: "#34D399" },
  failed:   { label: "Failed",   color: "#F87171" },
  refunded: { label: "Refunded", color: "#A78BFA" },
};

/** Razorpay handler response (matches types/razorpay.d.ts) */
interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  hosting: "🖥️", maintenance: "🔧", infrastructure: "⚙️",
  security: "🔒", domain: "🌐", integration: "⚡", support: "💬", custom: "📦",
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src    = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function ClientServicesInner() {
  const { accessToken, user } = useAuth();
  const [subs, setSubs] = useState<ClientSub[]>([]);
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payingMonthly, setPayingMonthly] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const rzpScriptLoaded = useRef(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [showRaiseTicket, setShowRaiseTicket] = useState(false);
  const [raiseTicketServiceId, setRaiseTicketServiceId] = useState<string | null>(null);
  const [ordersForTickets, setOrdersForTickets] = useState<{ id?: string; _id?: string; orderId?: string; title?: string }[]>([]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/client/services", { 
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(15000) // 15s timeout
      });
      
      if (!r.ok) {
        const errorText = await r.text().catch(() => "");
        let errorData: { error?: string } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // If not JSON, use status-based message
          if (r.status === 401) {
            setLoadError("Session expired. Please log in again.");
            return;
          }
          if (r.status === 503) {
            setLoadError("Services temporarily unavailable. Please try again in a moment.");
            return;
          }
          setLoadError(`Server error (${r.status}). Please try again.`);
          return;
        }
        setLoadError(errorData.error || `Server error (${r.status}). Please try again.`);
        return;
      }

      const d = await r.json().catch(() => ({}));
      setSubs(Array.isArray(d.services) ? d.services : []);
      setInvoices(Array.isArray(d.invoices) ? d.invoices : []);
      
      // Debug info in development
      if (process.env.NODE_ENV === "development" && d._debug) {
        console.log("[Services] Debug info:", d._debug);
      }
    } catch (err) {
      setSubs([]);
      setInvoices([]);
      
      if (err instanceof Error) {
        if (err.name === "TimeoutError" || err.message.includes("timeout")) {
          setLoadError("Request timed out. Please check your connection and try again.");
        } else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          setLoadError("Network error. Please check your connection and try again.");
        } else {
          setLoadError("Failed to load services. Please try again.");
        }
      } else {
        setLoadError("Failed to load services. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!rzpScriptLoaded.current && subs.length > 0) {
      rzpScriptLoaded.current = true;
      loadRazorpayScript();
    }
  }, [subs.length]);

  const handleReject = async (id: string) => {
    if (!confirm("Decline this service?")) return;
    await fetch(`/api/client/services/${id}/reject`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
    load();
  };

  const handleCancel = async (id: string, name: string) => {
    if (!confirm(`Cancel "${name}"? You will not be charged for future months.`)) return;
    await fetch(`/api/client/services/${id}/cancel`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
    load();
  };

  const openPayment = async (clientServiceId: string, type: "first" | "renewal", amountRupees: number) => {
    setPayingId(clientServiceId);
    setPaymentMsg(null);
    try {
      // Load Razorpay script first
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setPaymentMsg({ type: "error", text: "Payment gateway failed to load. Please refresh and try again." });
        setPayingId(null);
        return;
      }

      // Create order on server
      const url = type === "first"
        ? `/api/client/services/${clientServiceId}/create-payment?type=first`
        : `/api/client/services/${clientServiceId}/create-payment?type=renewal`;
      const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await r.json();

      if (d.error || !d.success) {
        setPaymentMsg({ type: "error", text: d.error || "Could not create payment order." });
        setPayingId(null);
        return;
      }

      if (!d.keyId || !d.orderId) {
        setPaymentMsg({ type: "error", text: "Invalid payment response from server." });
        setPayingId(null);
        return;
      }

      // Open real Razorpay checkout
      const rzp = new window.Razorpay({
        key:         d.keyId,
        amount:      d.amount,
        currency:    d.currency || "INR",
        order_id:    d.orderId,
        name:        "Websevix",
        description: type === "first" ? "Service - First Month" : "Service - Renewal",
        image:       "/logo.png",
        theme:       { color: "#6366F1" },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const vr = await fetch("/api/client/services/verify-payment", {
              method:  "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
              body:    JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            });
            const vd = await vr.json();
            if (vd.success) {
              setPaymentMsg({ type: "success", text: vd.message || "Payment successful! Service activated." });
              load();
            } else {
              setPaymentMsg({ type: "error", text: vd.error || "Payment verification failed." });
            }
          } catch {
            setPaymentMsg({ type: "error", text: "Payment verification error. Contact support." });
          } finally {
            setPayingId(null);
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
      });
      rzp.open();
    } catch {
      setPaymentMsg({ type: "error", text: "Could not start payment." });
      setPayingId(null);
    }
  };

  // Monthly total payment — all pending + all due in one go
  const openMonthlyPayment = async () => {
    setPayingMonthly(true);
    setPaymentMsg(null);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setPaymentMsg({ type: "error", text: "Payment gateway failed to load. Please refresh." });
        return;
      }

      const r = await fetch("/api/client/services/pay-monthly", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await r.json();

      if (d.error || !d.success) {
        setPaymentMsg({ type: "error", text: d.error || "Could not create payment." });
        return;
      }

      const rzp = new window.Razorpay({
        key:         d.keyId,
        amount:      d.amount,
        currency:    "INR",
        order_id:    d.orderId,
        name:        "Websevix",
        description: `Monthly Services — ${d.servicesCount} service${d.servicesCount > 1 ? "s" : ""}`,
        image:       "/logo.png",
        prefill: {
          name:  `${(user as any)?.firstName ?? ""} ${(user as any)?.lastName ?? ""}`.trim(),
          email: (user as any)?.email ?? "",
        },
        theme: { color: "#6366F1" },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const vr = await fetch("/api/client/services/verify-payment", {
              method:  "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
              body:    JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            });
            const vd = await vr.json();
            if (vd.success) {
              setPaymentMsg({ type: "success", text: vd.message || "Payment successful! Services activated." });
              load();
            } else {
              setPaymentMsg({ type: "error", text: vd.error || "Verification failed." });
            }
          } catch {
            setPaymentMsg({ type: "error", text: "Verification error. Contact support." });
          } finally {
            setPayingMonthly(false);
          }
        },
        modal: { ondismiss: () => setPayingMonthly(false) },
      });
      rzp.open();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment failed.";
      setPaymentMsg({ type: "error", text: msg });
      setPayingMonthly(false);
    }
  };

  const pending  = subs.filter(s => s && s.status === "pending_acceptance");
  const active   = subs.filter(s => s && s.status === "active");
  const others   = subs.filter(s => s && !["pending_acceptance", "active"].includes(s.status));
  const hasServices = subs.length > 0;

  // Services that need payment right now
  const needsPayment = [
    ...pending,
    ...active.filter(s => s.isDue),
  ];
  const monthlyTotal = needsPayment.reduce((sum, s) => {
    const svc = s.serviceId;
    return sum + (s.customPrice ?? svc?.basePrice ?? 0);
  }, 0);

  useEffect(() => {
    if (!showRaiseTicket || !accessToken) return;
    fetch("/api/orders", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => setOrdersForTickets(d.orders ?? []))
      .catch(() => {});
  }, [showRaiseTicket, accessToken]);

  const handleCreateTicketFromServices = async (data: {
    category: string;
    relatedServiceId?: string;
    relatedOrderId?: string;
    subject: string;
    description: string;
    priority: string;
    attachments: { url: string; name: string; size: number; mimeType: string }[];
  }) => {
    if (!accessToken) return;
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const out = await res.json();
    if (out.error) throw new Error(out.error);
    setShowRaiseTicket(false);
    setRaiseTicketServiceId(null);
  };

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      ))}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display text-snow">My Services</h1>
          <p className="text-sm text-slate mt-1">Activate services and pay monthly to keep them running</p>
        </div>

        {/* Monthly total payment button — shows only when payment is due */}
        {needsPayment.length > 0 && (
          <button
            onClick={openMonthlyPayment}
            disabled={payingMonthly}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            {payingMonthly
              ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
              : <><CreditCard size={14} /> Pay ₹{monthlyTotal.toLocaleString("en-IN")} for {needsPayment.length} service{needsPayment.length > 1 ? "s" : ""}</>
            }
          </button>
        )}
      </div>

      {loadError && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl text-sm text-amber-200 bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span className="flex-1 min-w-0">{loadError}</span>
          <div className="flex gap-2">
            {loadError.toLowerCase().includes("log in") || loadError.toLowerCase().includes("session") || loadError.toLowerCase().includes("expired") ? (
              <a href="/login" className="text-xs font-medium text-amber-400 hover:underline">Log in again</a>
            ) : loadError.toLowerCase().includes("network") || loadError.toLowerCase().includes("connection") ? (
              <>
                <button onClick={() => { setLoadError(null); load(); }} className="text-xs font-medium text-amber-400 hover:underline">Retry</button>
                <button onClick={() => window.location.reload()} className="text-xs font-medium text-amber-300 hover:underline">Refresh page</button>
              </>
            ) : loadError.toLowerCase().includes("timeout") ? (
              <>
                <button onClick={() => { setLoadError(null); load(); }} className="text-xs font-medium text-amber-400 hover:underline">Try again</button>
                <button onClick={() => window.location.reload()} className="text-xs font-medium text-amber-300 hover:underline">Refresh page</button>
              </>
            ) : (
              <button onClick={() => { setLoadError(null); load(); }} className="text-xs font-medium text-amber-400 hover:underline">Retry</button>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {paymentMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm"
            style={{
              background: paymentMsg.type === "success" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
              border:     paymentMsg.type === "success" ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(248,113,113,0.25)",
              color:      paymentMsg.type === "success" ? "#34D399" : "#F87171",
            }}>
            <span className="flex items-center gap-2">
              {paymentMsg.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {paymentMsg.text}
            </span>
            <button onClick={() => setPaymentMsg(null)} className="opacity-60 hover:opacity-100"><X size={13} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {pending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Clock size={14} /> Awaiting Payment ({pending.length})
          </h2>
          <p className="text-xs text-slate">Pay for the first month to activate each service. Next month you’ll see “Due” and pay again to continue.</p>
          {pending.map((sub, i) => (
            <motion.div key={sub._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
              <PendingCard sub={sub} onReject={handleReject} onPay={openPayment} payingId={payingId} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" /> Active Services ({active.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((sub, i) => (
              <motion.div key={sub._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ActiveCard
                  sub={sub}
                  onCancel={handleCancel}
                  onPayDue={openPayment}
                  payingId={payingId}
                  onRaiseTicket={() => { setRaiseTicketServiceId(sub._id); setShowRaiseTicket(true); }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate">Other Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {others.map(sub => {
              const svc = sub.serviceId;
              if (!svc) return null;
              const price = sub.customPrice ?? svc.basePrice ?? 0;
              return (
                <div key={sub._id} className="rounded-2xl p-4 flex items-center justify-between opacity-60"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{svc.icon ?? CATEGORY_ICONS[svc.category] ?? "📦"}</span>
                    <div>
                      <p className="text-sm text-snow">{svc.name ?? "Service"}</p>
                      <p className="text-xs text-slate">₹{price.toLocaleString("en-IN")}/{svc.billingCycle ?? "mo"}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: STATUS_CFG[sub.status].color, background: STATUS_CFG[sub.status].bg }}>
                    {STATUS_CFG[sub.status].label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasServices && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Shield size={40} className="text-slate" />
          <p className="text-sm font-medium text-snow">No services yet</p>
          <p className="text-xs text-slate">Services assigned by Websevix will appear here. Pay for the first month to activate.</p>
        </div>
      )}

      {invoices.length > 0 && <InvoiceSection invoices={invoices} />}

      <AnimatePresence>
        {showRaiseTicket && (
          <RaiseTicketModal
            onClose={() => { setShowRaiseTicket(false); setRaiseTicketServiceId(null); }}
            onSubmit={handleCreateTicketFromServices}
            initialCategory="service_issue"
            initialRelatedServiceId={raiseTicketServiceId ?? undefined}
            clientServices={subs.map((s) => ({ _id: s._id, serviceId: s.serviceId, customPrice: s.customPrice ?? undefined }))}
            clientOrders={ordersForTickets.map((o) => ({ _id: o.id ?? o._id ?? "", orderId: o.orderId, title: o.title }))}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ClientServicesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    }>
      <ClientServicesInner />
    </Suspense>
  );
}

function PendingCard({ sub, onReject, onPay, payingId }: {
  sub: ClientSub; onReject: (id: string) => void; onPay: (id: string, type: "first", amount: number) => void; payingId: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const svc = sub.serviceId;
  if (!svc) return null;
  const price = sub.customPrice ?? svc.basePrice ?? 0;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.2)" }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{svc.icon ?? CATEGORY_ICONS[svc.category] ?? "📦"}</span>
            <div>
              <p className="text-sm font-semibold text-snow">{svc.name ?? "Service"}</p>
              <p className="text-xs text-slate">₹{price.toLocaleString("en-IN")}/{svc.billingCycle ?? "mo"} · Pay for first month to activate</p>
            </div>
          </div>
          {svc.features?.length > 0 && (
            <button onClick={() => setExpanded(v => !v)} className="p-1.5 text-slate hover:text-snow transition-colors">
              <motion.div animate={{ rotate: expanded ? 180 : 0 }}><X size={13} /></motion.div>
            </button>
          )}
        </div>

        <AnimatePresence>
          {expanded && svc.features?.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="mb-3 space-y-1.5">
                {svc.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate">
                    <CheckCircle2 size={10} className="text-emerald-400 flex-shrink-0" />{f}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 mt-2">
          {!sub.isMandatory && (
            <button onClick={() => onReject(sub._id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate border border-white/10 hover:border-red-500/30 hover:text-red-400 transition-all">
              <XCircle size={12} /> Decline
            </button>
          )}
          <button
            onClick={() => onPay(sub._id, "first", price)}
            disabled={payingId === sub._id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
            {payingId === sub._id ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
            {payingId === sub._id ? "Opening…" : `Pay ₹${price.toLocaleString("en-IN")} for first month`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveCard({ sub, onCancel, onPayDue, payingId, onRaiseTicket }: {
  sub: ClientSub; onCancel: (id: string, name: string) => void;
  onPayDue: (id: string, type: "renewal", amount: number) => void; payingId: string | null;
  onRaiseTicket?: () => void;
}) {
  const svc = sub.serviceId;
  if (!svc) return null;
  const price = sub.customPrice ?? svc.basePrice ?? 0;
  const isDue = sub.isDue === true;

  return (
    <div className="rounded-2xl p-4 hover:border-emerald-500/20 transition-all"
      style={{
        background: isDue ? "rgba(251,191,36,0.04)" : "rgba(255,255,255,0.02)",
        border:     isDue ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(255,255,255,0.07)",
      }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{svc.icon ?? CATEGORY_ICONS[svc.category] ?? "📦"}</span>
          <div>
            <p className="text-sm font-semibold text-snow">{svc.name ?? "Service"}</p>
            <p className="text-xs text-slate">
              Valid till {sub.nextBillingDate
                ? new Date(sub.nextBillingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "—"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-snow">₹{price.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-slate">/{sub.serviceId.billingCycle}</p>
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ color: isDue ? "#FBBF24" : "#34D399", background: isDue ? "rgba(251,191,36,0.1)" : "rgba(52,211,153,0.1)" }}>
            {isDue ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
            {isDue ? "Payment due" : "Active"}
          </span>
          {sub.isMandatory && (
            <span className="text-[10px] px-2 py-0.5 rounded-full text-amber-400 bg-amber-500/10">🔒 Mandatory</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRaiseTicket && (
            <button
              onClick={onRaiseTicket}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/10 transition-all">
              <Ticket size={11} /> Raise Ticket
            </button>
          )}
          {isDue && (
            <button
              onClick={() => onPayDue(sub._id, "renewal", price)}
              disabled={payingId === sub._id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60">
              {payingId === sub._id ? <Loader2 size={11} className="animate-spin" /> : null}
              {payingId === sub._id ? "Opening…" : `Pay ₹${price.toLocaleString("en-IN")} for next month`}
            </button>
          )}
          {!sub.isMandatory && (
            <button onClick={() => onCancel(sub._id, sub.serviceId.name)}
              className="text-[10px] text-slate hover:text-red-400 border border-transparent hover:border-red-500/20 px-2 py-1 rounded-lg transition-all">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InvoiceSection({ invoices }: { invoices: IInvoice[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
        <FileText size={14} className="text-indigo-400" /> Invoice History
      </h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Invoice", "Month", "Services", "Amount", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-slate font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-slate">{inv.invoiceNo}</td>
                <td className="px-4 py-3 text-xs text-snow">{inv.month}</td>
                <td className="px-4 py-3 text-xs text-slate">{inv.lineItems?.length ?? 0} services</td>
                <td className="px-4 py-3 text-xs font-semibold text-snow">₹{inv.total.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium" style={{ color: INV_CFG[inv.status]?.color ?? "#64748B" }}>
                    {INV_CFG[inv.status]?.label ?? inv.status}
                    {inv.paidAt && ` · ${new Date(inv.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
