"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Monitor, Package, CreditCard, User, HelpCircle, Loader2 } from "lucide-react";

export type TicketCategory = "service_issue" | "order_issue" | "billing" | "account" | "general";
export type TicketPriority = "low" | "medium" | "high" | "critical";

const CATEGORIES: { id: TicketCategory; label: string; icon: React.ReactNode }[] = [
  { id: "service_issue", label: "Service Issue", icon: <Monitor size={24} /> },
  { id: "order_issue", label: "Order/Project", icon: <Package size={24} /> },
  { id: "billing", label: "Billing", icon: <CreditCard size={24} /> },
  { id: "account", label: "Account", icon: <User size={24} /> },
  { id: "general", label: "General", icon: <HelpCircle size={24} /> },
];

interface ServiceOption { _id: string; serviceId?: { name?: string }; customPrice?: number }
interface OrderOption { _id: string; orderId?: string; title?: string }

interface RaiseTicketModalProps {
  onClose: () => void;
  onSubmit: (data: {
    category: TicketCategory;
    relatedServiceId?: string;
    relatedOrderId?: string;
    subject: string;
    description: string;
    priority: TicketPriority;
    attachments: { url: string; name: string; size: number; mimeType: string }[];
  }) => Promise<void>;
  initialCategory?: TicketCategory;
  initialRelatedServiceId?: string;
  initialRelatedOrderId?: string;
  clientServices?: ServiceOption[];
  clientOrders?: OrderOption[];
}

export function RaiseTicketModal({
  onClose,
  onSubmit,
  initialCategory,
  initialRelatedServiceId,
  initialRelatedOrderId,
  clientServices = [],
  clientOrders = [],
}: RaiseTicketModalProps) {
  const [step, setStep] = useState<1 | 2>(initialCategory ? 2 : 1);
  const [category, setCategory] = useState<TicketCategory>(initialCategory ?? "general");
  const [relatedServiceId, setRelatedServiceId] = useState(initialRelatedServiceId ?? "");
  const [relatedOrderId, setRelatedOrderId] = useState(initialRelatedOrderId ?? "");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!subject.trim()) { setError("Subject is required"); return; }
    if (!description.trim()) { setError("Description is required"); return; }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        category,
        relatedServiceId: relatedServiceId || undefined,
        relatedOrderId: relatedOrderId || undefined,
        subject: subject.trim().slice(0, 150),
        description: description.trim().slice(0, 2000),
        priority,
        attachments: [],
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "#0E0E1A" }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-[#0E0E1A]/95 z-10">
          <h2 className="font-display font-bold text-lg text-snow">
            {step === 1 ? "Choose category" : "Raise a Support Ticket"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate hover:text-snow">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
              >
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCategory(c.id); setStep(2); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-snow"
                  >
                    <span className="text-2xl text-indigo-400">{c.icon}</span>
                    <span className="text-xs font-medium text-center">{c.label}</span>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate">Category</span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-indigo-400 hover:underline"
                  >
                    {CATEGORIES.find((c) => c.id === category)?.label} — Change
                  </button>
                </div>

                {category === "service_issue" && clientServices.length > 0 && (
                  <div>
                    <label className="text-xs text-slate block mb-1">Related Service</label>
                    <select
                      value={relatedServiceId}
                      onChange={(e) => setRelatedServiceId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-snow bg-white/5 border border-white/10 outline-none"
                    >
                      <option value="">Select (optional)</option>
                      {clientServices.map((s) => (
                        <option key={s._id} value={s._id}>
                          {typeof s.serviceId === "object" && s.serviceId && "name" in s.serviceId
                            ? (s.serviceId as { name?: string }).name
                            : "Service"} {s._id.slice(-6)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {category === "order_issue" && clientOrders.length > 0 && (
                  <div>
                    <label className="text-xs text-slate block mb-1">Related Order</label>
                    <select
                      value={relatedOrderId}
                      onChange={(e) => setRelatedOrderId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-snow bg-white/5 border border-white/10 outline-none"
                    >
                      <option value="">Select (optional)</option>
                      {clientOrders.map((o) => (
                        <option key={o._id} value={o._id}>
                          {(o as OrderOption).orderId || (o as OrderOption).title || o._id.slice(-6)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate block mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue"
                    maxLength={150}
                    className="w-full px-3 py-2 rounded-lg text-sm text-snow placeholder:text-slate bg-white/5 border border-white/10 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate block mb-1">Priority</label>
                  <div className="flex gap-3 flex-wrap">
                    {(["low", "medium", "high", "critical"] as const).map((p) => (
                      <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="priority"
                          checked={priority === p}
                          onChange={() => setPriority(p)}
                          className="rounded-full border-white/20"
                        />
                        <span className="text-sm text-silver capitalize">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    maxLength={2000}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg text-sm text-snow placeholder:text-slate bg-white/5 border border-white/10 outline-none resize-none"
                  />
                  <p className="text-[10px] text-slate mt-0.5">{description.length} / 2000</p>
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#6366F1,#7C3AED)" }}
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                    Submit Ticket
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
