"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Paperclip,
  MoreVertical, CheckCheck, Check, FileText,
  Download, X, Image as ImageIcon, Loader2,
  ShieldCheck, IndianRupee, CreditCard, Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────

interface FileAttachment {
  url:      string;
  name:     string;
  size?:    number;
  mimeType?: string;
}

interface Msg {
  _id:              string;
  senderId:         string;
  senderRole:       "client" | "admin";
  type:             "text" | "file" | "image" | "system" | "payment_request";
  content?:         string;
  file?:            FileAttachment;
  createdAt:        string;
  isRead:           boolean;
  // payment request fields
  paymentRequestId?: string;
  paymentAmount?:    number;
  paymentType?:      "advance" | "milestone" | "final";
  paymentStatus?:    "pending" | "paid" | "cancelled";
}

// ─── Helpers ──────────────────────────────────────────────────────

function fmtTime(d: string): string {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function fmtDate(d: string): string {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString())     return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function groupByDate(msgs: Msg[]): Array<{ date: string; items: Msg[] }> {
  const groups: Record<string, Msg[]> = {};
  for (const m of msgs) {
    const key = fmtDate(m.createdAt);
    (groups[key] ??= []).push(m);
  }
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Payment Request Card ─────────────────────────────────────────

function PaymentCard({
  msg,
  accessToken,
  onPaid,
}: {
  msg: Msg;
  accessToken: string | null;
  onPaid: (msgId: string) => void;
}) {
  const [paying,  setPaying]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(msg.paymentStatus === "paid");

  const TYPE_LABELS: Record<string, string> = {
    advance: "Advance Payment",
    milestone: "Milestone Payment",
    final: "Final Payment",
  };

  const handlePay = async () => {
    if (!accessToken || !msg.paymentRequestId) return;
    setPaying(true);
    setError("");
    try {
      // Load Razorpay script
      if (!document.querySelector('script[src*="razorpay"]')) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => res(); s.onerror = () => rej(new Error("Razorpay load failed"));
          document.body.appendChild(s);
        });
      }
      // Create Razorpay order
      const initRes  = await fetch(`/api/payments/requests/${msg.paymentRequestId}/pay`, {
        method: "POST", headers: { Authorization: `Bearer ${accessToken}` },
      });
      const initData = await initRes.json();
      if (!initData.success) throw new Error(initData.error ?? "Payment init failed");
      const rzpOrder = initData.order;

      // Mock mode
      if (rzpOrder._mock) {
        await fetch(`/api/payments/requests/${msg.paymentRequestId}/verify`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ razorpay_order_id: rzpOrder.id, razorpay_payment_id: `pay_mock_${Date.now()}`, razorpay_signature: "mock", _mock: true }),
        });
        setSuccess(true); onPaid(msg._id);
        return;
      }

      // Real Razorpay popup
      setPaying(false);
      new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount:      rzpOrder.amount,
        currency:    rzpOrder.currency,
        name:        "Websevix",
        description: TYPE_LABELS[msg.paymentType ?? "advance"] ?? "Payment",
        order_id:    rzpOrder.id,
        theme:       { color: "#10B981" },
        modal:       { ondismiss: () => setPaying(false) },
        handler: async (res: RazorpaySuccessResponse) => {
          setPaying(true);
          await fetch(`/api/payments/requests/${msg.paymentRequestId}/verify`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ ...res }),
          });
          setSuccess(true); onPaid(msg._id);
          setPaying(false);
        },
      }).open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setPaying(false);
    }
  };

  return (
    <motion.div
      className="flex justify-start my-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className="w-72 rounded-2xl overflow-hidden"
        style={{
          background: success
            ? "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.06))"
            : "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.06))",
          border: `1px solid ${success ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.3)"}`,
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-2.5"
          style={{ borderBottom: `1px solid ${success ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.15)"}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: success ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)" }}>
            {success ? <ShieldCheck size={18} className="text-emerald-400" /> : <IndianRupee size={18} className="text-indigo-400" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-snow">{TYPE_LABELS[msg.paymentType ?? "advance"]}</p>
            <p className="text-[10px] text-slate">From Websevix Team</p>
          </div>
        </div>
        {/* Amount */}
        <div className="px-4 py-3">
          <p className="text-[11px] text-slate mb-1">{success ? "Paid" : "Amount Due"}</p>
          <p className="text-2xl font-bold font-display"
            style={{ color: success ? "#10B981" : "#A78BFA" }}>
            ₹{(msg.paymentAmount ?? 0).toLocaleString("en-IN")}
          </p>
          {msg.content && (
            <p className="text-xs text-slate mt-1 line-clamp-2">
              {msg.content.replace(/^Payment request:\s*₹[\d,.]+\s*—\s*/i, "")}
            </p>
          )}
        </div>
        {/* Action */}
        <div className="px-4 pb-4">
          {success ? (
            <div className="flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold text-emerald-400"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <ShieldCheck size={15} /> Payment Received
            </div>
          ) : (
            <>
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
              >
                {paying ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                {paying ? "Processing…" : "Pay Now"}
              </button>
              {error && <p className="text-[10px] text-red-400 mt-1.5 text-center">{error}</p>}
              <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-slate">
                <Lock size={9} /> Secured by Razorpay
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────

function Bubble({ msg, isOwn }: { msg: Msg; isOwn: boolean }) {
  const [lightbox, setLightbox] = useState(false);

  if (msg.type === "system") {
    return (
      <motion.div
        className="flex justify-center my-1"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <span className="text-xs text-slate px-3 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {msg.content}
        </span>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
        initial={{ opacity: 0, y: 12, x: isOwn ? 12 : -12 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Admin avatar */}
        {!isOwn && (
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mb-1"
            style={{ background: "linear-gradient(135deg,#06B6D4,#3B82F6)" }}>
            W
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative max-w-[72%] sm:max-w-[60%] rounded-2xl overflow-hidden ${
            isOwn ? "rounded-br-sm" : "rounded-bl-sm"
          }`}
          style={isOwn
            ? { background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", boxShadow: "0 2px 12px rgba(99,102,241,0.3)" }
            : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
          }
        >
          {msg.type === "image" && msg.file ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={msg.file.url}
                alt={msg.file.name}
                className="w-full max-w-xs object-cover cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxHeight: 260 }}
                onClick={() => setLightbox(true)}
              />
              <div className={`px-3 py-1.5 flex items-center justify-end gap-1.5 text-xs ${isOwn ? "text-indigo-200" : "text-slate"}`}>
                <span>{fmtTime(msg.createdAt)}</span>
                {isOwn && (msg.isRead ? <CheckCheck size={13} /> : <Check size={13} />)}
              </div>
            </div>
          ) : msg.type === "file" && msg.file ? (
            <div className="p-3">
              <a href={msg.file.url} download={msg.file.name} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isOwn ? "rgba(255,255,255,0.15)" : "rgba(99,102,241,0.2)" }}>
                  <FileText size={18} className={isOwn ? "text-white" : "text-indigo-400"} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isOwn ? "text-white" : "text-snow"}`}>{msg.file.name}</p>
                  <p className={`text-xs ${isOwn ? "text-indigo-200" : "text-slate"}`}>{formatFileSize(msg.file.size)}</p>
                </div>
                <Download size={15} className={`flex-shrink-0 opacity-60 group-hover:opacity-100 ${isOwn ? "text-white" : "text-slate"}`} />
              </a>
              <div className={`mt-2 flex items-center justify-end gap-1.5 text-xs ${isOwn ? "text-indigo-200" : "text-slate"}`}>
                <span>{fmtTime(msg.createdAt)}</span>
                {isOwn && (msg.isRead ? <CheckCheck size={13} /> : <Check size={13} />)}
              </div>
            </div>
          ) : (
            <div className="px-4 py-2.5">
              <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwn ? "text-white" : "text-snow"}`}>
                {msg.content}
              </p>
              <div className={`flex items-center justify-end gap-1.5 mt-0.5 text-xs ${isOwn ? "text-indigo-200" : "text-slate"}`}>
                <span>{fmtTime(msg.createdAt)}</span>
                {isOwn && (msg.isRead ? <CheckCheck size={13} /> : <Check size={13} />)}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Image lightbox */}
      <AnimatePresence>
        {lightbox && msg.file && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.92)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
          >
            <motion.img
              src={msg.file.url}
              alt={msg.file.name}
              className="max-w-full max-h-full rounded-xl object-contain"
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
            />
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────

function TypingBubble() {
  return (
    <motion.div className="flex items-end gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
        style={{ background: "linear-gradient(135deg,#06B6D4,#3B82F6)" }}>W</div>
      <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {[0, 0.18, 0.36].map((delay, i) => (
          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-slate"
            animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay, ease: "easeInOut" }} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── File preview ────────────────────────────────────────────────

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImg = file.type.startsWith("image/");
  const url   = isImg ? URL.createObjectURL(file) : null;

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.1] text-sm"
      style={{ background: "rgba(99,102,241,0.08)" }}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
    >
      {isImg && url
        ? <img src={url} alt="" className="w-8 h-8 rounded-lg object-cover" />
        : <FileText size={18} className="text-indigo-400 flex-shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-xs text-snow truncate">{file.name}</p>
        <p className="text-xs text-slate">{formatFileSize(file.size)}</p>
      </div>
      <button onClick={onRemove} className="text-slate hover:text-red-400 transition-colors">
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────

export default function OrderChatPage() {
  const { orderId }    = useParams<{ orderId: string }>();
  const router         = useRouter();
  const { accessToken, user } = useAuth();

  const [msgs,        setMsgs]       = useState<Msg[]>([]);
  const [input,       setInput]      = useState("");
  const [sending,     setSending]    = useState(false);
  const [loading,     setLoading]    = useState(true);
  const [file,        setFile]       = useState<File | null>(null);
  const [uploading,   setUploading]  = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [orderTitle,  setOrderTitle] = useState("Project Chat");

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgTime = useRef<string | null>(null);

  // Initial full load
  const fetchMessages = useCallback(async (silent = false) => {
    if (!orderId || !accessToken) return;
    if (!silent) setLoading(true);
    try {
      const r    = await fetch(`/api/messages/${orderId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await r.json();
      if (data.messages && data.messages.length > 0) {
        setMsgs(data.messages);
        lastMsgTime.current = data.messages[data.messages.length - 1].createdAt;
      }
    } catch { /* ignore */ }
    finally { if (!silent) setLoading(false); }
  }, [orderId, accessToken]);

  // Fast incremental poll — only fetches NEW messages since last known
  const pollNew = useCallback(async () => {
    if (!orderId || !accessToken) return;
    try {
      const since = lastMsgTime.current ?? new Date(0).toISOString();
      const r     = await fetch(
        `/api/messages/${orderId}?since=${encodeURIComponent(since)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = await r.json();
      if (data.messages && data.messages.length > 0) {
        setMsgs(prev => {
          const existingIds = new Set(prev.map((m: { _id: string }) => m._id));
          const fresh = data.messages.filter((m: { _id: string }) => !existingIds.has(m._id));
          if (fresh.length === 0) return prev;
          lastMsgTime.current = fresh[fresh.length - 1].createdAt;
          return [...prev, ...fresh];
        });
      }
    } catch { /* ignore poll errors */ }
  }, [orderId, accessToken]);

  // Fetch order title
  useEffect(() => {
    if (!orderId || !accessToken) return;
    fetch(`/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.order?.title) setOrderTitle(d.order.title); })
      .catch(() => {});
  }, [orderId, accessToken]);

  useEffect(() => {
    fetchMessages();
    // Poll every 300ms — only new messages via ?since=
    pollRef.current = setInterval(pollNew, 300);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages, pollNew]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(scrollToBottom, [msgs, adminTyping, scrollToBottom]);

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const sendText = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic update
    const optimistic: Msg = {
      _id:        `opt-${Date.now()}`,
      senderId:   user?.id ?? "",
      senderRole: "client",
      type:       "text",
      content:    text,
      createdAt:  new Date().toISOString(),
      isRead:     false,
    };
    setMsgs(prev => [...prev, optimistic]);

    try {
      await fetch(`/api/messages/${orderId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ type: "text", content: text }),
      });
      await fetchMessages(true);
    } catch { /* optimistic stays */ }
    finally { setSending(false); }
  };

  const sendFile = async (f: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const up   = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form });
      const upD  = await up.json();
      if (!upD.success) throw new Error(upD.error ?? "Upload failed");

      const type = f.type.startsWith("image/") ? "image" : "file";
      await fetch(`/api/messages/${orderId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ type, content: f.name, file: { url: upD.url, name: f.name, size: f.size, mimeType: f.type } }),
      });
      await fetchMessages(true);
    } finally {
      setFile(null);
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = "";
  };

  const grouped = groupByDate(msgs);

  return (
    <motion.div
      className="flex flex-col h-[calc(100vh-0px)] max-h-[calc(100vh-72px)] rounded-2xl overflow-hidden"
      style={{ background: "#07070F" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ─── Header ─────────────────────────────────────────── */}
      <motion.div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] flex-shrink-0"
        style={{ background: "rgba(10,10,22,0.95)", backdropFilter: "blur(12px)" }}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-slate hover:text-snow hover:bg-white/[0.05] transition-colors"
          whileTap={{ scale: 0.92 }}
        >
          <ArrowLeft size={18} />
        </motion.button>

        {/* Contact info */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg,#6366F1,#06B6D4)", boxShadow: "0 0 14px rgba(99,102,241,0.35)" }}>
            W
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#07070F]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-snow truncate">Websevix Team</p>
          <p className="text-xs text-slate truncate">{orderTitle}</p>
        </div>

        <div className="flex items-center gap-1">
          <motion.button className="p-2 rounded-xl text-slate hover:text-snow hover:bg-white/[0.05] transition-colors" whileTap={{ scale: 0.92 }}>
            <MoreVertical size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* ─── Encryption notice ──────────────────────────────── */}
      <motion.div
        className="flex items-center justify-center gap-1.5 py-2 text-xs text-slate"
        style={{ background: "rgba(255,255,255,0.015)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      >
        <ShieldCheck size={11} className="text-emerald-500" />
        <span>Messages are private between you and the Websevix team</span>
      </motion.div>

      {/* ─── Messages ────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.07) transparent",
          backgroundImage: "radial-gradient(rgba(99,102,241,0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 size={24} className="text-indigo-400 animate-spin" />
            <p className="text-xs text-slate">Loading messages…</p>
          </div>
        ) : msgs.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center h-full text-center gap-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))", border: "1px solid rgba(99,102,241,0.2)" }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ImageIcon size={28} className="text-indigo-400" />
            </motion.div>
            <div>
              <p className="text-silver font-semibold mb-1">No messages yet</p>
              <p className="text-xs text-slate max-w-xs">Send a message to start the conversation with your project team. They usually reply within a few hours.</p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ date, items }) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-xs text-slate px-3 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                <div className="space-y-1.5">
                  {items.map(msg =>
                    msg.type === "payment_request" ? (
                      <PaymentCard
                        key={msg._id}
                        msg={msg}
                        accessToken={accessToken}
                        onPaid={(id) =>
                          setMsgs(prev =>
                            prev.map(m => m._id === id ? { ...m, paymentStatus: "paid" } : m)
                          )
                        }
                      />
                    ) : (
                      <Bubble key={msg._id} msg={msg} isOwn={msg.senderRole === "client"} />
                    )
                  )}
                </div>
              </div>
            ))}
            {adminTyping && <TypingBubble />}
          </div>
        )}
      </div>

      {/* ─── Input area ──────────────────────────────────────── */}
      <motion.div
        className="flex-shrink-0 border-t border-white/[0.07] px-4 py-3 space-y-2"
        style={{ background: "rgba(10,10,22,0.95)", backdropFilter: "blur(12px)" }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* File preview */}
        <AnimatePresence>
          {file && (
            <FilePreview file={file} onRemove={() => setFile(null)} />
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.zip,.txt" />
          <motion.button
            onClick={() => fileRef.current?.click()}
            className="p-2.5 rounded-xl text-slate hover:text-indigo-400 hover:bg-indigo-500/[0.08] transition-colors flex-shrink-0"
            whileTap={{ scale: 0.9 }}
          >
            <Paperclip size={18} />
          </motion.button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="w-full resize-none rounded-2xl px-4 py-2.5 text-sm text-snow placeholder-slate/50 focus:outline-none transition-colors"
              style={{
                background:  "rgba(255,255,255,0.05)",
                border:      "1px solid rgba(255,255,255,0.09)",
                maxHeight:   120,
                lineHeight:  "1.5",
              }}
              onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(99,102,241,0.5)"; }}
              onBlur={e  => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.09)"; }}
            />
          </div>

          {/* Send button */}
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div key="up" className="p-2.5" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Loader2 size={18} className="text-indigo-400 animate-spin" />
              </motion.div>
            ) : file ? (
              <motion.button
                key="send-file"
                onClick={() => sendFile(file)}
                className="p-2.5 rounded-xl text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
              >
                <Send size={18} />
              </motion.button>
            ) : (
              <motion.button
                key="send-text"
                onClick={sendText}
                disabled={!input.trim() || sending}
                className="p-2.5 rounded-xl flex-shrink-0 text-white disabled:opacity-40 transition-all"
                style={{ background: input.trim() ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "rgba(255,255,255,0.06)" }}
                whileTap={{ scale: 0.9 }}
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
