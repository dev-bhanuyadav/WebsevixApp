"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageSquare,
  Send,
  Paperclip,
  Loader2,
  IndianRupee,
  X,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";

type OrderStatus = "pending_review" | "in_progress" | "completed" | "cancelled";

const STATUS_COLORS: Record<OrderStatus, { label: string; cls: string }> = {
  pending_review: { label: "Pending Review", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  in_progress: { label: "In Progress", cls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  completed: { label: "Completed", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  cancelled: { label: "Cancelled", cls: "text-red-400 bg-red-500/10 border-red-500/20" },
};

interface OrderClient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface OrderConversation {
  _id: string;
  orderId: string;
  status: OrderStatus;
  clientId: OrderClient | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  title?: string;
  aiSummary?: { projectType?: string };
}

interface ChatMessage {
  _id: string;
  content: string;
  senderRole: "client" | "admin";
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
}

interface MessagesResponse {
  messages: ChatMessage[];
}

interface OrdersResponse {
  orders: OrderConversation[];
}

function AdminMessagesContent() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("id");

  const [orders, setOrders] = useState<OrderConversation[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  // Payment request form
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount]     = useState("");
  const [payDesc, setPayDesc]         = useState("");
  const [payType, setPayType]         = useState<"advance" | "milestone" | "final">("advance");
  const [sendingPay, setSendingPay]   = useState(false);
  const [payError, setPayError]       = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgTime    = useRef<string | null>(null);

  const selectedOrder = orders.find((o) => o._id === selectedOrderId) ?? null;

  useEffect(() => {
    if (!accessToken) return;
    setLoadingOrders(true);
    fetch("/api/admin/orders?limit=50", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: OrdersResponse) => {
        const list = d.orders ?? [];
        setOrders(list);
        // Auto-select if navigated from orders page with ?id=
        if (preselectedId && !selectedOrderId) {
          const match = list.find((o) => o._id === preselectedId);
          if (match) setSelectedOrderId(match._id);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingOrders(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Full load when switching conversations
  const fetchMessages = useCallback(
    (orderId: string) => {
      if (!accessToken) return;
      setLoadingMessages(true);
      lastMsgTime.current = null;
      fetch(`/api/messages/${orderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => r.json())
        .then((d: MessagesResponse) => {
          const list = d.messages ?? [];
          setMessages(list);
          if (list.length > 0) lastMsgTime.current = list[list.length - 1].createdAt;
        })
        .catch(console.error)
        .finally(() => setLoadingMessages(false));
    },
    [accessToken],
  );

  // Incremental poll — only fetches messages newer than last known
  const pollNew = useCallback(() => {
    if (!accessToken || !selectedOrderId) return;
    const since = lastMsgTime.current ?? new Date(0).toISOString();
    fetch(`/api/messages/${selectedOrderId}?since=${encodeURIComponent(since)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: MessagesResponse) => {
        const fresh = d.messages ?? [];
        if (fresh.length === 0) return;
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const newOnes = fresh.filter((m) => !existingIds.has(m._id));
          if (newOnes.length === 0) return prev;
          lastMsgTime.current = newOnes[newOnes.length - 1].createdAt;
          return [...prev, ...newOnes];
        });
      })
      .catch(() => {});
  }, [accessToken, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrderId) return;
    fetchMessages(selectedOrderId);
  }, [selectedOrderId, fetchMessages]);

  // Start fast polling when a conversation is open
  useEffect(() => {
    if (!selectedOrderId) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(pollNew, 300);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedOrderId, pollNew]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!accessToken || !selectedOrderId || !inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");
    setSending(true);

    const optimistic: ChatMessage = {
      _id: `opt-${Date.now()}`,
      content: text,
      senderRole: "admin",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/messages/${selectedOrderId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: text, senderRole: "admin" }),
      });
      const d = (await res.json()) as { message?: ChatMessage };
      if (d.message) {
        setMessages((prev) =>
          prev.map((m) => (m._id === optimistic._id ? d.message! : m))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendPaymentRequest = async () => {
    if (!accessToken || !selectedOrder || !payAmount) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) { setPayError("Enter a valid amount"); return; }
    setSendingPay(true);
    setPayError("");
    try {
      // Create PaymentRequest in DB
      const prRes = await fetch("/api/admin/payments/request", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId:     selectedOrder._id,
          clientId:    selectedOrder.clientId?._id,
          amount,
          description: payDesc || `${payType.charAt(0).toUpperCase() + payType.slice(1)} payment`,
          type:        payType,
        }),
      });
      const prData = await prRes.json();
      if (!prRes.ok) throw new Error(prData.error ?? "Failed to create payment request");

      // Send a payment_request message in chat
      const msgRes = await fetch(`/api/messages/${selectedOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          content:          `Payment request: ₹${amount} — ${payDesc || payType}`,
          type:             "payment_request",
          paymentRequestId: prData.request._id,
          paymentAmount:    amount,
          paymentType:      payType,
          paymentStatus:    "pending",
        }),
      });
      const msgData = await msgRes.json();
      if (msgData.message) {
        setMessages(prev => [...prev, msgData.message]);
        lastMsgTime.current = msgData.message.createdAt;
      }
      setShowPayForm(false);
      setPayAmount(""); setPayDesc(""); setPayType("advance");
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Error sending payment request");
    } finally {
      setSendingPay(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  const clientName = (o: OrderConversation) =>
    o.clientId ? `${o.clientId.firstName} ${o.clientId.lastName}` : "Unknown";

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const name = clientName(o).toLowerCase();
    return (
      name.includes(search.toLowerCase()) ||
      o.orderId.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="h-[calc(100vh-7rem)] flex rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Left panel: conversation list */}
      <div
        className="w-80 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Header */}
        <div
          className="px-4 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h2 className="text-sm font-semibold font-display text-snow mb-3">Conversations</h2>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs text-snow rounded-lg outline-none placeholder:text-slate"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingOrders ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
              <MessageSquare size={28} className="text-slate" />
              <p className="text-xs text-slate text-center">No conversations</p>
            </div>
          ) : (
            filtered.map((o) => {
              const isSelected = selectedOrderId === o._id;
              return (
                <button
                  key={o._id}
                  onClick={() => setSelectedOrderId(o._id)}
                  className="w-full text-left px-4 py-3 transition-all relative"
                  style={{
                    background: isSelected
                      ? "rgba(99,102,241,0.1)"
                      : "transparent",
                    borderLeft: isSelected ? "2px solid #6366F1" : "2px solid transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 text-[11px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
                      >
                        {clientName(o)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-snow truncate">
                          {clientName(o)}
                        </p>
                        <p className="text-[11px] font-mono" style={{ color: "#818CF8" }}>
                          #{o.orderId}
                        </p>
                      </div>
                    </div>
                    {o.unreadCount ? (
                      <span
                        className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                        style={{ background: "#EF4444" }}
                      >
                        {o.unreadCount > 9 ? "9+" : o.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate truncate pl-9">
                    {o.aiSummary?.projectType ?? o.title ?? "No subject"}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-60">
            <MessageSquare size={48} className="text-slate" />
            <p className="text-sm text-slate font-medium">Select a conversation</p>
            <p className="text-xs text-slate">Choose an order from the left panel</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-snow">{clientName(selectedOrder)}</p>
                    <p className="text-xs font-mono" style={{ color: "#818CF8" }}>#{selectedOrder.orderId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[selectedOrder.status]?.cls ?? ""}`}>
                    {STATUS_COLORS[selectedOrder.status]?.label ?? selectedOrder.status}
                  </span>
                  <button
                    onClick={() => { setShowPayForm(v => !v); setPayError(""); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.1))", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}
                  >
                    <IndianRupee size={12} />
                    Request Payment
                    <ChevronDown size={11} style={{ transform: showPayForm ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                  </button>
                </div>
              </div>

              {/* Payment request form — slides down */}
              <AnimatePresence>
                {showPayForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1 space-y-3" style={{ background: "rgba(16,185,129,0.04)", borderTop: "1px solid rgba(16,185,129,0.12)" }}>
                      <p className="text-xs font-semibold text-emerald-400">New Payment Request</p>
                      <div className="flex gap-2">
                        {/* Amount */}
                        <div className="flex-1">
                          <label className="text-[10px] text-slate mb-1 block">Amount (₹)</label>
                          <input
                            type="number"
                            min={1}
                            placeholder="e.g. 5000"
                            value={payAmount}
                            onChange={e => setPayAmount(e.target.value)}
                            className="w-full px-3 py-2 text-sm text-snow rounded-lg outline-none"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                          />
                        </div>
                        {/* Type */}
                        <div>
                          <label className="text-[10px] text-slate mb-1 block">Type</label>
                          <select
                            value={payType}
                            onChange={e => setPayType(e.target.value as typeof payType)}
                            className="px-3 py-2 text-sm text-snow rounded-lg outline-none"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                          >
                            <option value="advance">Advance</option>
                            <option value="milestone">Milestone</option>
                            <option value="final">Final</option>
                          </select>
                        </div>
                      </div>
                      {/* Description */}
                      <div>
                        <label className="text-[10px] text-slate mb-1 block">Description (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 50% advance for homepage design"
                          value={payDesc}
                          onChange={e => setPayDesc(e.target.value)}
                          className="w-full px-3 py-2 text-sm text-snow rounded-lg outline-none"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                      </div>
                      {payError && <p className="text-xs text-red-400">{payError}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSendPaymentRequest}
                          disabled={sendingPay || !payAmount}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                          style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}
                        >
                          {sendingPay ? <Loader2 size={14} className="animate-spin" /> : <IndianRupee size={14} />}
                          {sendingPay ? "Sending…" : `Send ₹${payAmount || "0"} Request`}
                        </button>
                        <button
                          onClick={() => setShowPayForm(false)}
                          className="p-2 rounded-lg text-slate hover:text-snow hover:bg-white/10 transition-all"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={24} className="text-slate animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
                  <MessageSquare size={32} className="text-slate" />
                  <p className="text-sm text-slate">No messages yet</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isAdmin = msg.senderRole === "admin";
                    return (
                      <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className="max-w-[70%] rounded-2xl px-4 py-2.5"
                          style={
                            isAdmin
                              ? {
                                  background: "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(79,70,229,0.35))",
                                  border: "1px solid rgba(99,102,241,0.3)",
                                  borderBottomRightRadius: "4px",
                                }
                              : {
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  borderBottomLeftRadius: "4px",
                                }
                          }
                        >
                          {msg.fileUrl && (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-300 underline block mb-1"
                            >
                              📎 {msg.fileName ?? "File"}
                            </a>
                          )}
                          <p className="text-sm text-snow leading-relaxed">{msg.content}</p>
                          <p className="text-[10px] text-slate mt-1 text-right">
                            {formatTime(msg.createdAt)}
                            {isAdmin && <span className="ml-1 text-indigo-400">· Admin</span>}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="px-4 py-3 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="flex items-end gap-2 rounded-xl p-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 p-2 rounded-lg text-slate hover:text-snow hover:bg-white/10 transition-all"
                >
                  <Paperclip size={15} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={() => {}}
                />
                <textarea
                  rows={1}
                  placeholder="Type a message... (Enter to send)"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 text-sm text-snow bg-transparent outline-none resize-none placeholder:text-slate leading-relaxed py-1 max-h-28"
                  style={{ minHeight: "24px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !inputText.trim()}
                  className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)" }}
                >
                  {sending ? (
                    <Loader2 size={14} className="animate-spin text-white" />
                  ) : (
                    <Send size={13} className="text-white" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center rounded-2xl"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <Loader2 size={24} className="text-indigo-400 animate-spin" />
      </div>
    }>
      <AdminMessagesContent />
    </Suspense>
  );
}
