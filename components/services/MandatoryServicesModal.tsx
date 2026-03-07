"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle2, X, Loader2, IndianRupee, Lock } from "lucide-react";

interface IService {
  _id:          string;
  name:         string;
  description?: string;
  category:     string;
  icon?:        string;
  basePrice:    number;
  billingCycle: string;
  isMandatory:  boolean;
  features:     string[];
}

interface MandatoryServicesModalProps {
  orderId:      string;
  accessToken:  string | null;
  onClose:      () => void;
  onConfirmed:  () => void;
}

export function MandatoryServicesModal({ orderId, accessToken, onClose, onConfirmed }: MandatoryServicesModalProps) {
  const [services,  setServices]  = useState<IService[]>([]);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/services?isActive=true", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => {
        const all: IService[] = d.services ?? [];
        setServices(all);
        // Pre-select mandatory + optional (optional on by default)
        const presel = new Set(all.map((s: IService) => s._id));
        setSelected(presel);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const mandatory = services.filter(s => s.isMandatory);
  const optional  = services.filter(s => !s.isMandatory);

  const toggleOptional = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const mandatoryTotal = mandatory.reduce((s, svc) => s + svc.basePrice, 0);
  const optionalTotal  = optional.filter(s => selected.has(s._id)).reduce((s, svc) => s + svc.basePrice, 0);
  const grandTotal     = mandatoryTotal + optionalTotal;

  const confirm = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      // Create ClientService records for all selected services
      const selectedServices = services.filter(s => selected.has(s._id));
      await Promise.all(
        selectedServices.map(svc =>
          fetch("/api/admin/services/assign", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId:       "self", // will be resolved by API using token
              serviceId:      svc._id,
              isMandatory:    svc.isMandatory,
              relatedOrderId: orderId,
              billingStartNow: false,
            }),
          })
        )
      );
    } catch { /* non-fatal */ } finally {
      setSaving(false);
      onConfirmed();
    }
  };

  if (loading || services.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-lg rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
          style={{ background: "#0A0A14", border: "1px solid rgba(99,102,241,0.25)", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}
          initial={{ y: 60, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5 flex-shrink-0" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.06))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: 2, duration: 0.6, delay: 0.3 }}
                >
                  <Shield size={20} className="text-white" />
                </motion.div>
                <div>
                  <h3 className="text-base font-bold font-display text-snow">Services Included</h3>
                  <p className="text-xs text-slate mt-0.5">Review and confirm your ongoing services</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate hover:text-snow hover:bg-white/10 transition-all">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Mandatory */}
            {mandatory.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Lock size={12} className="text-amber-400" />
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Mandatory (Required)</p>
                </div>
                {mandatory.map((svc, i) => (
                  <motion.div key={svc._id}
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)" }}>
                      <CheckCircle2 size={12} className="text-amber-400" />
                    </motion.div>
                    <span className="text-lg flex-shrink-0">{svc.icon ?? "🛡️"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-snow">{svc.name}</p>
                      {svc.description && <p className="text-[11px] text-slate truncate">{svc.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-snow">₹{svc.basePrice.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-slate">/{svc.billingCycle}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Optional */}
            {optional.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate uppercase tracking-wider">Optional (Your Choice)</p>
                {optional.map((svc, i) => {
                  const checked = selected.has(svc._id);
                  return (
                    <motion.button key={svc._id}
                      onClick={() => toggleOptional(svc._id)}
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:border-indigo-500/30"
                      style={{ background: checked ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${checked ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.07)"}` }}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${checked ? "" : ""}`}
                        style={{ background: checked ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)", border: `1px solid ${checked ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.12)"}` }}>
                        {checked && <CheckCircle2 size={12} className="text-indigo-400" />}
                      </div>
                      <span className="text-lg flex-shrink-0">{svc.icon ?? "📦"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-snow">{svc.name}</p>
                        {svc.description && <p className="text-[11px] text-slate truncate">{svc.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${checked ? "text-snow" : "text-slate"}`}>₹{svc.basePrice.toLocaleString("en-IN")}</p>
                        <p className="text-[10px] text-slate">/{svc.billingCycle}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Divider + Totals */}
            <div className="pt-2 space-y-2 border-t border-white/[0.07]">
              <div className="flex justify-between text-sm">
                <span className="text-slate">Mandatory</span>
                <span className="text-amber-400 font-medium">₹{mandatoryTotal.toLocaleString("en-IN")}/mo</span>
              </div>
              {optionalTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate">Optional (selected)</span>
                  <span className="text-indigo-400 font-medium">₹{optionalTotal.toLocaleString("en-IN")}/mo</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold">
                <span className="text-snow">Total Monthly</span>
                <motion.span
                  key={grandTotal}
                  initial={{ scale: 1.1, color: "#A5B4FC" }}
                  animate={{ scale: 1, color: "#F8FAFC" }}
                  transition={{ duration: 0.3 }}
                  className="text-base text-snow">
                  ₹{grandTotal.toLocaleString("en-IN")}/mo
                </motion.span>
              </div>
              <p className="text-[10px] text-slate">Billing starts after project delivery. Autopay setup will be requested separately.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 flex-shrink-0 border-t border-white/[0.06] space-y-3">
            <button onClick={confirm} disabled={saving}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />}
              {saving ? "Confirming…" : "Confirm & Continue →"}
            </button>
            <button onClick={onClose} className="w-full py-2 text-sm text-slate hover:text-snow transition-colors">
              Skip for now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
