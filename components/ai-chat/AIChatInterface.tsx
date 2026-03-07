"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, SkipForward, Lock, CheckCircle, Loader2, X, CreditCard } from "lucide-react";
import { MandatoryServicesModal } from "@/components/services/MandatoryServicesModal";
import { AIMessage } from "./AIMessage";
import { UserMessage } from "./UserMessage";
import { TypingIndicator } from "./TypingIndicator";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { OPENING_MESSAGE, type AIResponse } from "@/lib/aiPrompt";
import { useAuth } from "@/hooks/useAuth";

const PLACEMENT_FEE = 500;
const PLACEMENT_FEE_DISPLAY = `₹500`;

interface ChatMsg {
  id:              string;
  role:            "user" | "assistant";
  content:         string;
  showChips?:      string[];
  showCheckboxes?: string[];
}

interface AIChatInterfaceProps {
  onOrderPlaced?: (orderId: string) => void;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

const PROGRESS_FIELDS = ["projectType","description","features","designStyle","budget","timeline"] as const;

function calcProgress(data: AIResponse["collectedData"]): number {
  const filled = PROGRESS_FIELDS.filter(f => {
    const v = data[f];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;
  return Math.round((filled / PROGRESS_FIELDS.length) * 100);
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.querySelector('script[src*="razorpay"]')) { resolve(true); return; }
    const s = document.createElement("script");
    s.src  = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function AIChatInterface({ onOrderPlaced }: AIChatInterfaceProps) {
  const { accessToken, user } = useAuth();
  const sessionId  = useRef(`vix-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  const [messages,      setMessages]      = useState<ChatMsg[]>([]);
  const [input,         setInput]         = useState("");
  const [isTyping,      setIsTyping]      = useState(false);
  const [collectedData, setCollectedData] = useState<AIResponse["collectedData"]>({});
  const [isComplete,    setIsComplete]    = useState(false);
  const [isPlacing,       setIsPlacing]       = useState(false);
  const [payModal,        setPayModal]        = useState(false);
  const [historyLock,     setHistoryLock]     = useState(false);
  const [payError,        setPayError]        = useState("");
  const [showSvcModal,    setShowSvcModal]     = useState(false);
  const [placedOrderId,   setPlacedOrderId]   = useState<string | null>(null);

  // Preload Razorpay script
  useEffect(() => { loadRazorpayScript(); }, []);

  // Opening message
  useEffect(() => {
    setTimeout(() => {
      setMessages([{
        id:        genId(),
        role:      "assistant",
        content:   OPENING_MESSAGE.message,
        showChips: OPENING_MESSAGE.showChips ?? undefined,
      }]);
    }, 400);
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(scrollToBottom, [messages, isTyping, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    setHistoryLock(false);

    const userMsg: ChatMsg = { id: genId(), role: "user", content: text };
    setMessages(prev => {
      const updated = prev.map((m, i) => i === prev.length - 1 && m.role === "assistant"
        ? { ...m, showChips: undefined, showCheckboxes: undefined } : m);
      return [...updated, userMsg];
    });
    setInput("");
    setIsTyping(true);

    try {
      const historyForAPI = messages.map(m => ({ role: m.role, content: m.content }));
      const res  = await fetch("/api/ai/consult", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ sessionId: sessionId.current, userMessage: text, conversationHistory: historyForAPI, collectedData }),
      });
      const data: AIResponse = await res.json();

      setCollectedData(prev => ({ ...prev, ...data.collectedData }));
      if (data.isComplete) setIsComplete(true);

      const aiMsg: ChatMsg = {
        id:             genId(),
        role:           "assistant",
        content:        data.message,
        showChips:      data.showChips  ?? undefined,
        showCheckboxes: data.showCheckboxes ?? undefined,
      };
      setMessages(prev => [...prev, aiMsg]);
      if (data.showChips || data.showCheckboxes) setHistoryLock(true);
    } catch {
      setMessages(prev => [...prev, { id: genId(), role: "assistant", content: "Hmm, something went wrong. Could you try again?" }]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, messages, collectedData, accessToken]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  // ─── Full Razorpay checkout flow ────────────────────────────
  const handlePlaceOrder = async () => {
    setPayError("");
    setIsPlacing(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay.");

      // Create Razorpay payment order
      const payRes  = await fetch("/api/payment/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ amount: PLACEMENT_FEE, currency: "INR" }),
      });
      const payData = await payRes.json().catch(() => ({}));
      const errMsg  = payData.error ?? (!payRes.ok ? "Unable to create payment. Please try again." : null);
      if (!payData.success || errMsg) throw new Error(errMsg ?? "Payment init failed.");

      const rzpOrder = payData.order;
      if (!rzpOrder?.id) throw new Error("Invalid payment response. Please try again.");

      // If mock mode (no Razorpay keys), skip checkout and go direct
      if (rzpOrder._mock) {
        await finishOrderCreation({
          razorpay_order_id:   rzpOrder.id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature:  "mock",
          _mock:               true,
        });
        return;
      }

      const rzpKey = payData.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
      if (!rzpKey) throw new Error("Payment gateway not configured. Please contact support.");

      // Real Razorpay checkout
      setIsPlacing(false); // let user interact with Razorpay popup
      const rzp = new window.Razorpay({
        key:         rzpKey,
        amount:      rzpOrder.amount,
        currency:    rzpOrder.currency,
        name:        "Websevix",
        description: "Project Slot Booking Fee",
        image:       "/logo.png",
        order_id:    rzpOrder.id,
        prefill: {
          name:    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
          email:   user?.email ?? "",
        },
        theme: { color: "#6366F1" },
        modal: {
          ondismiss: () => { setPayError("Payment cancelled."); },
        },
        handler: async (response: RazorpaySuccessResponse) => {
          setIsPlacing(true);
          await finishOrderCreation({
            razorpay_order_id:   response.razorpay_order_id ?? "",
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            _mock:               false,
          });
        },
      });
      rzp.open();

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setPayError(msg);
      setIsPlacing(false);
    }
  };

  const finishOrderCreation = async (paymentInfo: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    _mock: boolean;
  }) => {
    try {
      // Create order in DB
      const orderRes  = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ title: collectedData.projectType ?? "Web Project", aiSummary: collectedData, paymentId: paymentInfo.razorpay_order_id }),
      });
      const orderData = await orderRes.json();
      if (!orderData.order) throw new Error("Order creation failed.");

      // Verify payment
      await fetch("/api/payment/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ ...paymentInfo, orderId: orderData.order.id }),
      });

      setPayModal(false);
      // Show mandatory services modal before navigating
      setPlacedOrderId(orderData.order._id ?? orderData.order.id ?? "");
      setShowSvcModal(true);
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Order creation failed.");
    } finally {
      setIsPlacing(false);
    }
  };

  const progress = calcProgress(collectedData);

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* ─── Chat Panel ─── */}
      <div
        className="flex-1 flex flex-col min-w-0 rounded-2xl border border-white/[0.07] overflow-hidden"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]"
          style={{ background: "rgba(7,7,15,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 0 14px rgba(99,102,241,0.4)" }}
          >
            V
          </div>
          <div>
            <p className="text-sm font-semibold text-snow">Vix</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate">AI Project Consultant</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => msg.role === "assistant" ? (
              <AIMessage
                key={msg.id}
                content={msg.content}
                showChips={msg.showChips}
                showCheckboxes={msg.showCheckboxes}
                isLatest={i === messages.length - 1}
                onChipSelect={sendMessage}
                onCheckboxConfirm={vals => sendMessage(vals.join(", "))}
                disabled={isTyping}
              />
            ) : (
              <UserMessage key={msg.id} content={msg.content} />
            ))}
            {isTyping && <TypingIndicator key="typing" />}
          </AnimatePresence>
        </div>

        {/* Input area */}
        <div className="px-4 pb-4 pt-2 border-t border-white/[0.05]">
          <AnimatePresence>
            {isComplete && (
              <motion.div
                className="mb-3 p-3 rounded-xl text-sm text-emerald-300 border border-emerald-500/20 bg-emerald-500/[0.06] flex items-center gap-2"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                <CheckCircle size={14} className="flex-shrink-0" />
                All information collected! Click &quot;Place Order&quot; to proceed.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isTyping ? "Vix is typing…" : "Type your message…"}
              disabled={isTyping}
              rows={1}
              maxLength={2000}
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm text-snow placeholder-slate/50 bg-white/[0.05] border border-white/[0.09] focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
              style={{ maxHeight: 120 }}
            />
            <div className="flex gap-1.5">
              {!isComplete && (
                <motion.button
                  onClick={() => sendMessage("skip")}
                  disabled={isTyping}
                  className="p-3 rounded-xl text-slate hover:text-silver hover:bg-white/[0.06] border border-white/[0.08] transition-colors"
                  title="Skip this question"
                  whileTap={{ scale: 0.92 }}
                >
                  <SkipForward size={16} />
                </motion.button>
              )}
              <motion.button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="p-3 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ background: input.trim() ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "rgba(255,255,255,0.06)" }}
                whileTap={{ scale: 0.92 }}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Summary Card ─── */}
      <div className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
        <OrderSummaryCard
          data={collectedData}
          progress={progress}
          onPlace={() => setPayModal(true)}
          isPlacing={isPlacing}
          isComplete={isComplete}
        />
      </div>

      {/* ─── Mandatory Services Modal (post-payment) ─── */}
      {showSvcModal && placedOrderId && (
        <MandatoryServicesModal
          orderId={placedOrderId}
          accessToken={accessToken}
          onClose={() => { setShowSvcModal(false); onOrderPlaced?.(placedOrderId); }}
          onConfirmed={() => { setShowSvcModal(false); onOrderPlaced?.(placedOrderId); }}
        />
      )}

      {/* ─── Payment Modal ─── */}
      <AnimatePresence>
        {payModal && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isPlacing && setPayModal(false)}
            />
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="w-full max-w-sm rounded-2xl border border-white/[0.1] overflow-hidden"
                style={{ background: "#0D0D1A", boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)" }}
                initial={{ scale: 0.93, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.93, y: 12 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              >
                {/* Modal header gradient */}
                <div className="px-6 pt-6 pb-5" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 100%)" }}>
                  {!isPlacing && (
                    <button
                      onClick={() => setPayModal(false)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg text-slate hover:text-silver hover:bg-white/[0.06] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>
                    <CreditCard size={22} className="text-white" />
                  </div>
                  <h3 className="font-display font-bold text-snow text-lg text-center">Confirm Your Order</h3>
                  <p className="text-xs text-slate mt-1 text-center">One-time slot booking fee to confirm your project</p>
                </div>

                <div className="px-6 pb-6 space-y-4">
                  {/* Order summary */}
                  <div className="rounded-xl p-4 space-y-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate">Project type</span>
                      <span className="text-snow font-medium">{collectedData.projectType ?? "Web Project"}</span>
                    </div>
                    {collectedData.budget && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate">Your budget</span>
                        <span className="text-snow font-medium">{collectedData.budget}</span>
                      </div>
                    )}
                    {collectedData.timeline && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate">Timeline</span>
                        <span className="text-snow font-medium">{collectedData.timeline}</span>
                      </div>
                    )}
                    <div className="h-px bg-white/[0.06]" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate">Placement fee</span>
                      <span className="font-display font-bold text-snow text-lg">{PLACEMENT_FEE_DISPLAY}</span>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {payError && (
                      <motion.p className="text-xs text-red-400 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {payError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Pay button */}
                  <motion.button
                    onClick={handlePlaceOrder}
                    disabled={isPlacing}
                    className="w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {isPlacing ? (
                      <><Loader2 size={16} className="animate-spin" /> Processing…</>
                    ) : (
                      <><CreditCard size={16} /> Pay {PLACEMENT_FEE_DISPLAY} &amp; Place Order</>
                    )}
                  </motion.button>

                  <button
                    onClick={() => setPayModal(false)}
                    disabled={isPlacing}
                    className="w-full py-2 text-sm text-slate hover:text-silver transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate">
                    <Lock size={11} />
                    <span>Secured by Razorpay · SSL encrypted</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
