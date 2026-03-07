"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  User,
  CreditCard,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  ToggleLeft,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Tab = "platform" | "profile" | "payment" | "branding";

interface PlatformSettings {
  platformName: string;
  placementFee: number;
  maintenanceMode: boolean;
}

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "platform", label: "Platform", icon: Settings },
  { id: "profile", label: "Admin Profile", icon: User },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "branding", label: "Branding", icon: ImageIcon },
];

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly = false,
  prefix,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  prefix?: string;
}) {
  return (
    <div>
      <label className="text-xs text-slate mb-1.5 block font-medium uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          readOnly={readOnly}
          className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate transition-all"
          style={{
            background: readOnly ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
            border: readOnly
              ? "1px solid rgba(255,255,255,0.05)"
              : "1px solid rgba(255,255,255,0.09)",
            paddingLeft: prefix ? "1.75rem" : "0.75rem",
            cursor: readOnly ? "not-allowed" : "text",
            opacity: readOnly ? 0.6 : 1,
          }}
        />
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-xs text-slate mb-1.5 block font-medium uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-10 text-sm text-snow rounded-xl outline-none placeholder:text-slate"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-snow transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("platform");

  // Platform settings
  const [platformName, setPlatformName] = useState("Websevix");
  const [placementFee, setPlacementFee] = useState("500");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [platformResult, setPlatformResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load platform settings
  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/settings", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then(
        (d: {
          platformName?: string;
          placementFee?: number;
          maintenanceMode?: boolean;
        }) => {
          if (d.platformName) setPlatformName(d.platformName);
          if (typeof d.placementFee === "number")
            setPlacementFee(String(d.placementFee));
          if (typeof d.maintenanceMode === "boolean")
            setMaintenanceMode(d.maintenanceMode);
        }
      )
      .catch(() => {});
  }, [accessToken]);

  const savePlatformSettings = async () => {
    if (!accessToken) return;
    setSavingPlatform(true);
    setPlatformResult(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platformName,
          placementFee: parseFloat(placementFee) || 500,
          maintenanceMode,
        }),
      });
      const d = (await res.json()) as { success?: boolean; error?: string };
      if (d.success || res.ok) {
        setPlatformResult({ ok: true, msg: "Settings saved successfully!" });
      } else {
        setPlatformResult({ ok: false, msg: d.error ?? "Failed to save" });
      }
    } catch {
      setPlatformResult({ ok: false, msg: "Network error" });
    } finally {
      setSavingPlatform(false);
    }
  };

  // Branding
  const [logoWide,    setLogoWide]    = useState("");
  const [logoSquare,  setLogoSquare]  = useState("");
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingResult, setBrandingResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Load existing logos
  useEffect(() => {
    fetch("/api/site-settings")
      .then(r => r.json())
      .then((d: { logoWide?: string; logoSquare?: string }) => {
        if (d.logoWide)   setLogoWide(d.logoWide);
        if (d.logoSquare) setLogoSquare(d.logoSquare);
      })
      .catch(() => {});
  }, []);

  const saveBranding = async () => {
    if (!accessToken) return;
    setSavingBranding(true);
    setBrandingResult(null);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ logoWide: logoWide.trim(), logoSquare: logoSquare.trim() }),
      });
      const d = await res.json() as { success?: boolean; error?: string };
      if (d.success) {
        setBrandingResult({ ok: true, msg: "Logos saved! Refresh the page to see changes everywhere." });
      } else {
        setBrandingResult({ ok: false, msg: d.error ?? "Failed to save" });
      }
    } catch {
      setBrandingResult({ ok: false, msg: "Network error" });
    } finally {
      setSavingBranding(false);
    }
  };

  const adminName = user
    ? `${(user as { firstName?: string }).firstName ?? ""} ${(user as { lastName?: string }).lastName ?? ""}`.trim() || "Admin"
    : "Admin";
  const adminEmail = (user as { email?: string } | null)?.email ?? "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-3xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-snow">Settings</h1>
        <p className="text-sm text-slate mt-0.5">Manage platform and admin configuration</p>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {TAB_CONFIG.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === t.id ? "rgba(99,102,241,0.2)" : "transparent",
                color: activeTab === t.id ? "#A5B4FC" : "#64748B",
                border: activeTab === t.id ? "1px solid rgba(99,102,241,0.28)" : "1px solid transparent",
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "platform" && (
          <motion.div
            key="platform"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="rounded-2xl p-6 space-y-5"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <h3 className="text-sm font-semibold font-display text-snow">Platform Settings</h3>

              <InputField
                label="Platform Name"
                value={platformName}
                onChange={setPlatformName}
                placeholder="Websevix"
              />

              <InputField
                label="Placement Fee (₹)"
                value={placementFee}
                onChange={setPlacementFee}
                type="number"
                placeholder="500"
                prefix="₹"
              />

              {/* Maintenance mode toggle */}
              <div>
                <label className="text-xs text-slate mb-2 block font-medium uppercase tracking-wider">
                  Maintenance Mode
                </label>
                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: maintenanceMode ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
                    border: maintenanceMode
                      ? "1px solid rgba(245,158,11,0.18)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ToggleLeft
                      size={16}
                      style={{ color: maintenanceMode ? "#F59E0B" : "#64748B" }}
                    />
                    <div>
                      <p className="text-sm font-medium text-snow">
                        {maintenanceMode ? "Maintenance Active" : "Platform Online"}
                      </p>
                      <p className="text-xs text-slate mt-0.5">
                        {maintenanceMode
                          ? "Users cannot access the platform"
                          : "Platform is running normally"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMaintenanceMode((v) => !v)}
                    className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
                    style={{
                      background: maintenanceMode ? "#F59E0B" : "rgba(255,255,255,0.12)",
                    }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                      style={{ left: maintenanceMode ? "calc(100% - 1.375rem)" : "0.125rem" }}
                    />
                  </button>
                </div>
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {platformResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                      platformResult.ok
                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                        : "text-red-400 bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    {platformResult.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {platformResult.msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={savePlatformSettings}
                disabled={savingPlatform}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff" }}
              >
                {savingPlatform ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save Changes
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="rounded-2xl p-6 space-y-5"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <h3 className="text-sm font-semibold font-display text-snow">Admin Profile</h3>

              <InputField
                label="Full Name"
                value={adminName}
                readOnly
              />
              <InputField
                label="Email"
                value={adminEmail}
                readOnly
              />

              {/* Change password section */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={15} className="text-slate" />
                  <h4 className="text-sm font-semibold text-snow">Change Password</h4>
                </div>

                <div className="space-y-3 mb-4">
                  <PasswordField
                    label="Current Password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="Enter current password"
                  />
                  <PasswordField
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Enter new password"
                  />
                  <PasswordField
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm new password"
                  />
                </div>

                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.16)",
                    color: "#A5B4FC",
                  }}
                >
                  <Shield size={14} />
                  Contact system admin to change password for security reasons.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "payment" && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="rounded-2xl p-6 space-y-5"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <h3 className="text-sm font-semibold font-display text-snow">Payment Configuration</h3>

              {/* Razorpay status */}
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-slate" />
                  <div>
                    <p className="text-sm font-medium text-snow">Razorpay Integration</p>
                    <p className="text-xs text-slate mt-0.5">Payment gateway for order placement fees</p>
                  </div>
                </div>
                <span
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    color: "#10B981",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Configured
                </span>
              </div>

              {/* Info cards */}
              <div className="space-y-3">
                {[
                  {
                    label: "Key ID",
                    value: "Stored in environment variables",
                    color: "#818CF8",
                    bg: "rgba(99,102,241,0.08)",
                    border: "rgba(99,102,241,0.14)",
                  },
                  {
                    label: "Key Secret",
                    value: "Encrypted and stored securely",
                    color: "#10B981",
                    bg: "rgba(16,185,129,0.08)",
                    border: "rgba(16,185,129,0.14)",
                  },
                  {
                    label: "Webhook Secret",
                    value: "Configured for payment verification",
                    color: "#F59E0B",
                    bg: "rgba(245,158,11,0.08)",
                    border: "rgba(245,158,11,0.14)",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{
                      background: item.bg,
                      border: `1px solid ${item.border}`,
                    }}
                  >
                    <span className="text-sm text-slate">{item.label}</span>
                    <span className="text-xs font-medium" style={{ color: item.color }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">
                  Setup Instructions
                </p>
                <ul className="space-y-1.5 text-xs text-slate">
                  <li className="flex items-start gap-2">
                    <span style={{ color: "#818CF8" }}>1.</span>
                    Add <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">RAZORPAY_KEY_ID</code> to your environment variables
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: "#818CF8" }}>2.</span>
                    Add <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">RAZORPAY_KEY_SECRET</code> to your environment variables
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: "#818CF8" }}>3.</span>
                    Configure webhook endpoint in Razorpay dashboard: <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">/api/webhooks/razorpay</code>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: "#818CF8" }}>4.</span>
                    Add <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">RAZORPAY_WEBHOOK_SECRET</code> for signature verification
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === "branding" && (
          <motion.div
            key="branding"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="rounded-2xl p-6 space-y-6"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div>
                <h3 className="text-sm font-semibold font-display text-snow">Branding</h3>
                <p className="text-xs text-slate mt-0.5">Paste image URLs for your logos. Use Imgur, Cloudinary, Google Drive or any direct image link.</p>
              </div>

              {/* Wide Logo */}
              <div className="space-y-3">
                <label className="text-xs text-slate font-medium uppercase tracking-wider block">
                  Wide Logo URL <span className="normal-case text-slate/60">(Navbar / Header — has icon + text)</span>
                </label>
                <input
                  type="url"
                  value={logoWide}
                  onChange={e => setLogoWide(e.target.value)}
                  placeholder="https://i.imgur.com/your-wide-logo.png"
                  className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                />
                {/* Preview */}
                <div
                  className="flex items-center justify-center h-14 rounded-xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {logoWide
                    ? <img src={logoWide} alt="Wide logo preview" style={{ maxHeight: 48, maxWidth: "90%", objectFit: "contain" }}
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <span className="text-xs text-slate">Preview will appear here</span>
                  }
                </div>
                <p className="text-xs text-slate">Used in: Navbar, Sidebar (expanded), Login page</p>
              </div>

              {/* Square Logo */}
              <div className="space-y-3">
                <label className="text-xs text-slate font-medium uppercase tracking-wider block">
                  Square Logo URL <span className="normal-case text-slate/60">(Icon only — shown when collapsed)</span>
                </label>
                <input
                  type="url"
                  value={logoSquare}
                  onChange={e => setLogoSquare(e.target.value)}
                  placeholder="https://i.imgur.com/your-square-logo.png"
                  className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                />
                {/* Preview */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {logoSquare
                      ? <img src={logoSquare} alt="Square logo preview" style={{ width: 48, height: 48, objectFit: "contain" }}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <span className="text-xs text-slate font-bold">W</span>
                    }
                  </div>
                  <p className="text-xs text-slate">Used in: Sidebar icon (collapsed), Favicon, Login animation</p>
                </div>
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {brandingResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                      brandingResult.ok
                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                        : "text-red-400 bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    {brandingResult.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {brandingResult.msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={saveBranding}
                disabled={savingBranding}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff" }}
              >
                {savingBranding ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Logos
              </button>

              {/* How to get URL hint */}
              <div
                className="rounded-xl p-4 text-xs text-slate space-y-2"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}
              >
                <p className="font-semibold text-indigo-300/80">How to get an image URL:</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li><span className="text-silver">Imgur:</span> imgur.com → upload → right-click image → &quot;Copy image address&quot;</li>
                  <li><span className="text-silver">Cloudinary:</span> upload image → copy the delivery URL</li>
                  <li><span className="text-silver">Any host:</span> paste any direct <code className="text-indigo-400">.png / .jpg / .svg / .webp</code> URL</li>
                </ol>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
