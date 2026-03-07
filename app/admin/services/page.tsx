"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, Users, IndianRupee, TrendingUp, BarChart3,
  RefreshCw, Play, AlertTriangle, CheckCircle2, Loader2, X,
  Shield, Server, Wrench, Globe, Lock, Zap, HeadphonesIcon, Package,
  ChevronDown, Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "catalog" | "assign" | "subscriptions" | "billing" | "pricing";
type ServiceCategory = "hosting"|"maintenance"|"infrastructure"|"security"|"domain"|"integration"|"support"|"custom";
type BillingCycle    = "monthly"|"quarterly"|"yearly"|"one-time";
type SubStatus       = "pending_acceptance"|"active"|"paused"|"cancelled"|"rejected";

interface IService {
  _id: string; name: string; description?: string; category: ServiceCategory;
  basePrice: number; billingCycle: BillingCycle; isMandatory: boolean;
  isActive: boolean; icon?: string; features: string[];
}

interface ISubscription {
  _id: string;
  clientId:  { _id: string; firstName: string; lastName: string; email: string };
  serviceId: { _id: string; name: string; icon?: string; basePrice: number; category: string };
  customPrice?: number | null;
  status: SubStatus;
  isMandatory: boolean;
  nextBillingDate?: string;
  createdAt: string;
}

interface IUser { _id: string; firstName: string; lastName: string; email: string; }

interface MRR {
  mrr: number; arr: number; activeCount: number;
  byCategory: Record<string, number>; churnThisMonth: number; totalRevenue: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  hosting: <Server size={14} />, maintenance: <Wrench size={14} />,
  infrastructure: <Settings size={14} />, security: <Lock size={14} />,
  domain: <Globe size={14} />, integration: <Zap size={14} />,
  support: <HeadphonesIcon size={14} />, custom: <Package size={14} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  hosting: "#60A5FA", maintenance: "#34D399", infrastructure: "#A78BFA",
  security: "#F87171", domain: "#FBBF24", integration: "#FB923C",
  support: "#22D3EE", custom: "#94A3B8",
};

const STATUS_CFG: Record<SubStatus, { label: string; color: string; bg: string }> = {
  pending_acceptance: { label: "Pending",   color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
  active:             { label: "Active",    color: "#34D399", bg: "rgba(52,211,153,0.1)" },
  paused:             { label: "Paused",    color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  cancelled:          { label: "Cancelled", color: "#F87171", bg: "rgba(248,113,113,0.1)" },
  rejected:           { label: "Rejected",  color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16,1,0.3,1] as number[] } } };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminServicesPage() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<Tab>("catalog");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "catalog",       label: "Service Catalog",  icon: <Package size={15} /> },
    { id: "assign",        label: "Assign to Client", icon: <Users size={15} /> },
    { id: "subscriptions", label: "All Subscriptions",icon: <Shield size={15} /> },
    { id: "billing",       label: "Billing Dashboard",icon: <IndianRupee size={15} /> },
    { id: "pricing",       label: "Price Management", icon: <TrendingUp size={15} /> },
  ];

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-display text-snow">Services & Subscriptions</h1>
        <p className="text-sm text-slate mt-1">Manage services and monthly client billing</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl flex-wrap" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t.id
              ? { background: "linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))", color: "#A5B4FC", border: "1px solid rgba(99,102,241,0.3)" }
              : { color: "#64748B" }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {tab === "catalog"       && <CatalogTab       accessToken={accessToken} />}
          {tab === "assign"        && <AssignTab        accessToken={accessToken} />}
          {tab === "subscriptions" && <SubscriptionsTab accessToken={accessToken} />}
          {tab === "billing"       && <BillingTab       accessToken={accessToken} />}
          {tab === "pricing"       && <PricingTab       accessToken={accessToken} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── TAB 1: Catalog ───────────────────────────────────────────────────────────

function CatalogTab({ accessToken }: { accessToken: string | null }) {
  const [services, setServices] = useState<IService[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const r = await fetch("/api/admin/services", { headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await r.json();
      setServices(d.services ?? []);
    } finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (svc: IService) => {
    await fetch(`/api/admin/services/${svc._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !svc.isActive }),
    });
    load();
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service? Cannot delete if clients are active.")) return;
    const r = await fetch(`/api/admin/services/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
    const d = await r.json();
    if (d.error) alert(d.error); else load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate">{services.length} services in catalog</p>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
          <Plus size={15} /> Create Service
        </button>
      </div>

      {loading ? <GridSkeleton /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((svc, i) => (
            <motion.div key={svc._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35 }}
              className="rounded-2xl p-4 space-y-3 group hover:border-indigo-500/30 transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${CATEGORY_COLORS[svc.category]}18`, border: `1px solid ${CATEGORY_COLORS[svc.category]}30` }}>
                    {svc.icon ?? "🛡️"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-snow">{svc.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${CATEGORY_COLORS[svc.category]}18`, color: CATEGORY_COLORS[svc.category] }}>
                        {svc.category}
                      </span>
                      {svc.isMandatory && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-amber-400 bg-amber-500/10">mandatory</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(svc)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                    title={svc.isActive ? "Deactivate" : "Activate"}>
                    <div className={`w-8 h-4 rounded-full transition-all flex items-center ${svc.isActive ? "bg-emerald-500" : "bg-slate-600"}`}>
                      <div className={`w-3 h-3 bg-white rounded-full mx-0.5 transition-transform ${svc.isActive ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                  </button>
                  <button onClick={() => deleteService(svc._id)} className="p-1.5 rounded-lg text-slate hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-snow">₹{svc.basePrice.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-slate">per {svc.billingCycle}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${svc.isActive ? "text-emerald-400" : "text-slate"}`}>{svc.isActive ? "● Active" : "○ Inactive"}</p>
                </div>
              </div>
              {svc.features.length > 0 && (
                <ul className="space-y-1">
                  {svc.features.slice(0, 3).map((f, fi) => (
                    <li key={fi} className="flex items-center gap-1.5 text-[11px] text-slate">
                      <CheckCircle2 size={10} className="text-emerald-400 flex-shrink-0" />{f}
                    </li>
                  ))}
                  {svc.features.length > 3 && <li className="text-[10px] text-slate">+{svc.features.length - 3} more</li>}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {showForm && <CreateServiceModal accessToken={accessToken} onClose={() => setShowForm(false)} onSaved={load} />}
    </div>
  );
}

// ─── Create Service Modal ─────────────────────────────────────────────────────

function CreateServiceModal({ accessToken, onClose, onSaved }: { accessToken: string | null; onClose: () => void; onSaved: () => void }) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState<ServiceCategory>("maintenance");
  const [basePrice,   setBasePrice]   = useState("");
  const [billingCycle,setBillingCycle]= useState<BillingCycle>("monthly");
  const [isMandatory, setIsMandatory] = useState(false);
  const [icon,        setIcon]        = useState("🛡️");
  const [features,    setFeatures]    = useState<string[]>(["", "", ""]);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const save = async () => {
    if (!name.trim() || !basePrice) { setError("Name and price required"); return; }
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/admin/services", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), description, category, basePrice: parseFloat(basePrice),
          billingCycle, isMandatory, icon,
          features: features.filter(f => f.trim()),
          isActive: true,
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      onSaved(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: "#0D0D1A", border: "1px solid rgba(99,102,241,0.25)" }}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
          <h3 className="text-base font-bold font-display text-snow">Create Service</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate hover:text-snow hover:bg-white/10 transition-all"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate mb-1 block">Service Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Website Maintenance"
                className="w-full px-3 py-2 text-sm text-snow rounded-lg outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <label className="text-xs text-slate mb-1 block">Icon</label>
              <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={4}
                className="w-full px-3 py-2 text-lg text-center rounded-lg outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as ServiceCategory)}
                className="w-full px-3 py-2 text-sm text-snow rounded-lg outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {["hosting","maintenance","infrastructure","security","domain","integration","support","custom"].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate mb-1 block">Billing Cycle</label>
              <select value={billingCycle} onChange={e => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full px-3 py-2 text-sm text-snow rounded-lg outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate mb-1 block">Base Price (₹) *</label>
              <input type="number" min={0} value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="1000"
                className="w-full px-3 py-2 text-sm text-snow rounded-lg outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isMandatory} onChange={e => setIsMandatory(e.target.checked)} className="accent-amber-400 w-4 h-4" />
                <span className="text-sm text-snow">Mandatory service</span>
              </label>
              <p className="text-[10px] text-slate mt-0.5">Auto-added at order placement</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What this service includes..."
              className="w-full px-3 py-2 text-sm text-snow rounded-lg outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div>
            <label className="text-xs text-slate mb-1 block">Features (shown to client)</label>
            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input value={f} onChange={e => { const n = [...features]; n[i] = e.target.value; setFeatures(n); }}
                    placeholder={`Feature ${i + 1}`}
                    className="flex-1 px-3 py-2 text-sm text-snow rounded-lg outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
                  <button onClick={() => setFeatures(features.filter((_, fi) => fi !== i))} className="p-2 text-slate hover:text-red-400 transition-colors"><X size={13} /></button>
                </div>
              ))}
              <button onClick={() => setFeatures([...features, ""])} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                <Plus size={12} /> Add feature
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate hover:text-snow border border-white/10 hover:border-white/20 transition-all">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? "Creating…" : "Create Service"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── TAB 2: Assign to Client ──────────────────────────────────────────────────

function AssignTab({ accessToken }: { accessToken: string | null }) {
  const [services, setServices] = useState<IService[]>([]);
  const [clients,  setClients]  = useState<IUser[]>([]);
  const [selClient,setSelClient]= useState("");
  const [selService,setSelService]=useState("");
  const [useCustom, setUseCustom]= useState(false);
  const [customPrice,setCustomPrice]=useState("");
  const [mandatory, setMandatory]= useState(false);
  const [notes,     setNotes]    = useState("");
  const [billingNow,setBillingNow]=useState(false);
  const [sending,   setSending]  = useState(false);
  const [success,   setSuccess]  = useState(false);
  const [error,     setError]    = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/services", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json()).then(d => setServices(d.services ?? []));
    fetch("/api/admin/users?limit=100", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json()).then(d => setClients(d.users ?? []));
  }, [accessToken]);

  const selectedService = services.find(s => s._id === selService);

  const assign = async () => {
    if (!selClient || !selService) { setError("Select client and service"); return; }
    setSending(true); setError(""); setSuccess(false);
    try {
      const r = await fetch("/api/admin/services/assign", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId:    selClient,
          serviceId:   selService,
          customPrice: useCustom && customPrice ? parseFloat(customPrice) : null,
          isMandatory: mandatory,
          notes,
          billingStartNow: billingNow,
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setSuccess(true);
      setSelClient(""); setSelService(""); setUseCustom(false); setCustomPrice(""); setNotes(""); setMandatory(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to assign"); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h3 className="text-sm font-semibold text-snow">Offer Service to Client</h3>
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <label className="text-xs text-slate mb-1.5 block">Select Client</label>
          <select value={selClient} onChange={e => setSelClient(e.target.value)}
            className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <option value="">— Choose client —</option>
            {clients.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName} ({c.email})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate mb-1.5 block">Select Service</label>
          <select value={selService} onChange={e => { setSelService(e.target.value); setMandatory(services.find(s => s._id === e.target.value)?.isMandatory ?? false); }}
            className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <option value="">— Choose service —</option>
            {services.filter(s => s.isActive).map(s => <option key={s._id} value={s._id}>{s.icon} {s.name} — ₹{s.basePrice}/{s.billingCycle}</option>)}
          </select>
        </div>
        {selectedService && (
          <div className="p-3 rounded-xl space-y-2" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!useCustom} onChange={() => setUseCustom(false)} className="accent-indigo-400" />
                <span className="text-sm text-snow">Use base price (₹{selectedService.basePrice})</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={useCustom} onChange={() => setUseCustom(true)} className="accent-indigo-400" />
                <span className="text-sm text-snow">Custom price</span>
              </label>
              {useCustom && (
                <input type="number" min={0} value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="₹..."
                  className="w-28 px-2 py-1 text-sm text-snow rounded-lg outline-none"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
              )}
            </div>
          </div>
        )}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={mandatory} onChange={e => setMandatory(e.target.checked)} className="accent-amber-400 w-4 h-4" />
            <span className="text-sm text-snow">Mark as mandatory</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={billingNow} onChange={e => setBillingNow(e.target.checked)} className="accent-emerald-400 w-4 h-4" />
            <span className="text-sm text-snow">Bill immediately</span>
          </label>
        </div>
        <div>
          <label className="text-xs text-slate mb-1 block">Note to client (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="We're adding this for better performance..."
            className="w-full px-3 py-2 text-sm text-snow rounded-xl resize-none outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        {error   && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={12} /> Service offer sent to client!</p>}
        <button onClick={assign} disabled={sending}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {sending ? "Sending Offer…" : "Send Service Offer →"}
        </button>
      </div>
    </div>
  );
}

// ─── TAB 3: Subscriptions ─────────────────────────────────────────────────────

function SubscriptionsTab({ accessToken }: { accessToken: string | null }) {
  const [subs,    setSubs]    = useState<ISubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const q = filter !== "all" ? `?status=${filter}` : "";
    try {
      const r = await fetch(`/api/admin/services/subscriptions${q}&limit=50`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await r.json();
      setSubs(d.subscriptions ?? []);
    } finally { setLoading(false); }
  }, [accessToken, filter]);

  useEffect(() => { load(); }, [load]);

  const filters = ["all","active","pending_acceptance","paused","cancelled"];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
            style={filter === f
              ? { background: "rgba(99,102,241,0.2)", color: "#A5B4FC", border: "1px solid rgba(99,102,241,0.3)" }
              : { color: "#64748B", border: "1px solid rgba(255,255,255,0.06)" }}>
            {f === "pending_acceptance" ? "Pending" : f}
          </button>
        ))}
      </div>
      {loading ? <TableSkeleton /> : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Client","Service","Price","Type","Status","Next Billing"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-slate font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={s._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-snow">{s.clientId?.firstName} {s.clientId?.lastName}</p>
                    <p className="text-[10px] text-slate">{s.clientId?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{s.serviceId?.icon ?? "🛡️"}</span>
                      <span className="text-xs text-snow">{s.serviceId?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-snow font-medium">
                    ₹{(s.customPrice ?? s.serviceId?.basePrice ?? 0).toLocaleString("en-IN")}
                    {s.customPrice && <span className="text-[10px] text-indigo-400 ml-1">custom</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.isMandatory ? "text-amber-400 bg-amber-500/10" : "text-slate bg-white/5"}`}>
                      {s.isMandatory ? "Mandatory" : "Optional"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ color: STATUS_CFG[s.status]?.color, background: STATUS_CFG[s.status]?.bg }}>
                      {STATUS_CFG[s.status]?.label ?? s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate">
                    {s.nextBillingDate ? new Date(s.nextBillingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                  </td>
                </tr>
              ))}
              {subs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate">No subscriptions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── TAB 4: Billing Dashboard ─────────────────────────────────────────────────

function BillingTab({ accessToken }: { accessToken: string | null }) {
  const [mrr,        setMrr]        = useState<MRR | null>(null);
  const [preview,    setPreview]    = useState<{ clients: number; grandTotal: number; preview: { clientId: string; total: number; hasMandate: boolean }[] } | null>(null);
  const [running,    setRunning]    = useState(false);
  const [runResult,  setRunResult]  = useState<{ summary?: { queued: number; noMandate: number; errors: number; total: number } } | null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      fetch("/api/admin/services/mrr",              { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
      fetch("/api/admin/services/billing/preview",  { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
    ]).then(([m, p]) => { setMrr(m); setPreview(p); }).finally(() => setLoading(false));
  }, [accessToken]);

  const runBilling = async () => {
    if (!confirm(`Bill ${preview?.clients} clients — total ₹${preview?.grandTotal?.toLocaleString("en-IN")}?`)) return;
    setRunning(true); setRunResult(null);
    try {
      const r = await fetch("/api/admin/services/billing/run", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await r.json();
      setRunResult(d);
    } finally { setRunning(false); }
  };

  const statCard = (label: string, value: string, sub: string, color: string) => (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="text-xs text-slate mb-2">{label}</p>
      <p className="text-2xl font-bold font-display" style={{ color }}>{value}</p>
      <p className="text-[11px] text-slate mt-1">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {loading ? <GridSkeleton /> : mrr && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCard("Monthly Recurring Revenue", `₹${(mrr.mrr).toLocaleString("en-IN")}`, `${mrr.activeCount} active subscriptions`, "#34D399")}
            {statCard("Annual Recurring Revenue",  `₹${(mrr.arr).toLocaleString("en-IN")}`, "Projected 12-month revenue", "#60A5FA")}
            {statCard("Total Revenue",             `₹${(mrr.totalRevenue).toLocaleString("en-IN")}`, "All paid invoices", "#A78BFA")}
            {statCard("Churn This Month",          String(mrr.churnThisMonth), "Cancelled subscriptions", "#F87171")}
          </div>

          {/* MRR by category */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="text-sm font-semibold text-snow mb-4">MRR Breakdown by Category</h3>
            <div className="space-y-3">
              {Object.entries(mrr.byCategory).sort(([,a],[,b]) => b - a).map(([cat, amt]) => {
                const pct = mrr.mrr > 0 ? Math.round((amt / mrr.mrr) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-32 flex-shrink-0">
                      <span style={{ color: CATEGORY_COLORS[cat] ?? "#94A3B8" }}>{CATEGORY_ICONS[cat] ?? <Package size={14} />}</span>
                      <span className="text-xs text-snow capitalize">{cat}</span>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ background: `linear-gradient(90deg, ${CATEGORY_COLORS[cat] ?? "#6366F1"}, ${CATEGORY_COLORS[cat] ?? "#6366F1"}88)` }} />
                    </div>
                    <span className="text-xs text-snow w-20 text-right font-medium">₹{amt.toLocaleString("en-IN")} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bill This Month */}
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-snow">Bill This Month</h3>
            <p className="text-xs text-slate mt-1">
              {preview ? `${preview.clients} clients · ₹${preview.grandTotal?.toLocaleString("en-IN")} total` : "Loading preview…"}
            </p>
          </div>
          <button onClick={runBilling} disabled={running || !preview?.clients}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? "Billing…" : "Run Monthly Billing"}
          </button>
        </div>

        {runResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-4 rounded-xl space-y-2"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2"><CheckCircle2 size={15} /> Billing Completed</p>
            {runResult.summary && (
              <div className="grid grid-cols-4 gap-3 text-center">
                {[["Invoiced", runResult.summary.queued, "#34D399"],["No Mandate", runResult.summary.noMandate, "#FBBF24"],["Errors", runResult.summary.errors, "#F87171"],["Total ₹", runResult.summary.total?.toLocaleString("en-IN") ?? "0", "#A5B4FC"]].map(([k, v, c]) => (
                  <div key={k as string} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-lg font-bold" style={{ color: c as string }}>{v}</p>
                    <p className="text-[10px] text-slate">{k as string}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {preview && preview.preview?.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-slate">Clients to be billed:</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {preview.preview.map((c) => (
                <div key={c.clientId} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <span className="text-xs text-slate font-mono">{c.clientId.slice(-8)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-snow">₹{c.total.toLocaleString("en-IN")}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.hasMandate ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"}`}>
                      {c.hasMandate ? "✓ Mandate" : "⚠ No Mandate"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB 5: Pricing ───────────────────────────────────────────────────────────

function PricingTab({ accessToken }: { accessToken: string | null }) {
  const [services,   setServices]  = useState<IService[]>([]);
  const [selService, setSelService]= useState("");
  const [newPrice,   setNewPrice]  = useState("");
  const [reason,     setReason]    = useState("");
  const [applyTo,    setApplyTo]   = useState<"all"|"new_only">("all");
  const [saving,     setSaving]    = useState(false);
  const [result,     setResult]    = useState<{ updated: number; oldPrice: number; newPrice: number } | null>(null);
  const [error,      setError]     = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/services", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json()).then(d => setServices(d.services ?? []));
  }, [accessToken]);

  const selected = services.find(s => s._id === selService);

  const update = async () => {
    if (!selService || !newPrice) { setError("Select service and enter price"); return; }
    setSaving(true); setError(""); setResult(null);
    try {
      const r = await fetch("/api/admin/services/price-update", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: selService, newPrice: parseFloat(newPrice), reason, applyTo }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setResult(d);
      setServices(prev => prev.map(s => s._id === selService ? { ...s, basePrice: parseFloat(newPrice) } : s));
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h3 className="text-sm font-semibold text-snow">Update Service Price</h3>
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <label className="text-xs text-slate mb-1.5 block">Select Service</label>
          <select value={selService} onChange={e => { setSelService(e.target.value); setNewPrice(""); setResult(null); }}
            className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <option value="">— Choose service —</option>
            {services.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name} — Current: ₹{s.basePrice}</option>)}
          </select>
        </div>
        {selected && (
          <>
            <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-slate text-xs">Current base price</p>
              <p className="text-xl font-bold text-snow mt-0.5">₹{selected.basePrice.toLocaleString("en-IN")}<span className="text-xs text-slate font-normal">/{selected.billingCycle}</span></p>
            </div>
            <div>
              <label className="text-xs text-slate mb-1 block">New Price (₹)</label>
              <input type="number" min={0} value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Enter new price"
                className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <label className="text-xs text-slate mb-1 block">Apply to</label>
              <div className="flex gap-3">
                {([["all","All clients on base price"],["new_only","New assignments only"]] as [string,string][]).map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={v} checked={applyTo === v} onChange={() => setApplyTo(v as "all"|"new_only")} className="accent-indigo-400" />
                    <span className="text-sm text-snow">{l}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate mb-1 block">Reason (optional)</label>
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Infrastructure costs increased..."
                className="w-full px-3 py-2 text-sm text-snow rounded-xl outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
          </>
        )}
        {error  && <p className="text-xs text-red-400">{error}</p>}
        {result && (
          <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-emerald-400 font-semibold">✓ Updated {result.updated} subscriptions</p>
            <p className="text-slate text-xs mt-0.5">₹{result.oldPrice} → ₹{result.newPrice}</p>
          </div>
        )}
        <button onClick={update} disabled={saving || !selService || !newPrice}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {saving ? "Updating…" : "Update Price →"}
        </button>
      </div>
    </div>
  );
}

// ─── Shared Skeletons ─────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      ))}
    </div>
  );
}
