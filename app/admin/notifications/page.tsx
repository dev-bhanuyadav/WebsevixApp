"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Star,
  AlertTriangle,
  Gift,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type NotifType = "info" | "success" | "warning" | "promo";
type TargetType = "all" | "user";
type Channel = "in-app" | "email";

interface NotifUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface NotificationRecord {
  _id: string;
  targetType: TargetType;
  title: string;
  message: string;
  type: NotifType;
  channels: Channel[];
  status: string;
  sentAt: string;
  sentBy?: { firstName: string; lastName: string };
}

interface UsersSearchResponse {
  users: NotifUser[];
}

interface NotificationsResponse {
  notifications: NotificationRecord[];
}

const TYPE_CONFIG: Record<
  NotifType,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  info: { label: "Info", icon: Info, color: "#60A5FA", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.2)" },
  success: { label: "Success", icon: CheckCircle2, color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.2)" },
  warning: { label: "Warning", icon: AlertTriangle, color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)" },
  promo: { label: "Promo", icon: Gift, color: "#A78BFA", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.2)" },
};

export default function AdminNotificationsPage() {
  const { accessToken } = useAuth();

  // Form state
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<NotifUser | null>(null);
  const [userSearchResults, setUserSearchResults] = useState<NotifUser[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [channels, setChannels] = useState<Set<Channel>>(new Set<Channel>(["in-app"]));
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<NotifType>("info");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // History state
  const [history, setHistory] = useState<NotificationRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchHistory = useCallback(() => {
    if (!accessToken) return;
    setLoadingHistory(true);
    fetch("/api/admin/notifications", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: NotificationsResponse) => setHistory(d.notifications ?? []))
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [accessToken]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Debounced user search
  useEffect(() => {
    if (!accessToken || targetType !== "user" || !userSearch.trim()) {
      setUserSearchResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}&limit=5`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => r.json())
        .then((d: UsersSearchResponse) => {
          setUserSearchResults(d.users ?? []);
          setShowUserDropdown(true);
        })
        .catch(console.error);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [userSearch, targetType, accessToken]);

  const toggleChannel = (ch: Channel) => {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) {
        if (next.size > 1) next.delete(ch);
      } else {
        next.add(ch);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!accessToken) return;
    if (!notifTitle.trim() || !notifMessage.trim()) {
      setSubmitResult({ ok: false, msg: "Title and message are required." });
      return;
    }
    if (targetType === "user" && !selectedUser) {
      setSubmitResult({ ok: false, msg: "Please select a target user." });
      return;
    }
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const body: Record<string, unknown> = {
        targetType,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        type: notifType,
        channels: Array.from(channels),
      };
      if (targetType === "user" && selectedUser) {
        body.targetUsers = [selectedUser._id];
      }

      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const d = (await res.json()) as { success?: boolean; error?: string };
      if (d.success) {
        setSubmitResult({ ok: true, msg: "Notification sent successfully!" });
        setNotifTitle("");
        setNotifMessage("");
        setSelectedUser(null);
        setUserSearch("");
        fetchHistory();
      } else {
        setSubmitResult({ ok: false, msg: d.error ?? "Failed to send" });
      }
    } catch {
      setSubmitResult({ ok: false, msg: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-5xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-snow">Notifications</h1>
        <p className="text-sm text-slate mt-0.5">Send announcements and updates to users</p>
      </div>

      {/* Send Notification card */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{ background: "rgba(99,102,241,0.16)" }}
          >
            <Bell size={15} style={{ color: "#818CF8" }} />
          </div>
          <h3 className="text-sm font-semibold font-display text-snow">Send Notification</h3>
        </div>

        {/* Target */}
        <div className="mb-4">
          <label className="text-xs text-slate mb-2 block font-semibold uppercase tracking-wider">
            Target
          </label>
          <div className="flex items-center gap-3">
            {(["all", "user"] as TargetType[]).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => { setTargetType(t); setSelectedUser(null); setUserSearch(""); }}
                  className="flex items-center justify-center w-4 h-4 rounded-full border-2 transition-all cursor-pointer flex-shrink-0"
                  style={{
                    borderColor: targetType === t ? "#6366F1" : "rgba(255,255,255,0.2)",
                    background: targetType === t ? "#6366F1" : "transparent",
                  }}
                >
                  {targetType === t && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span
                  className="text-sm font-medium cursor-pointer"
                  style={{ color: targetType === t ? "#F8FAFC" : "#64748B" }}
                  onClick={() => { setTargetType(t); setSelectedUser(null); setUserSearch(""); }}
                >
                  {t === "all" ? "All Users" : "Specific User"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* User search */}
        <AnimatePresence>
          {targetType === "user" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <label className="text-xs text-slate mb-1.5 block">Search User</label>
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Name or email..."
                  value={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setSelectedUser(null);
                  }}
                  onFocus={() => userSearchResults.length > 0 && setShowUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 150)}
                  className="w-full pl-8 pr-4 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                />
                {showUserDropdown && userSearchResults.length > 0 && (
                  <div
                    className="absolute z-20 w-full mt-1 rounded-xl overflow-hidden"
                    style={{
                      background: "rgba(15,15,25,0.98)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}
                  >
                    {userSearchResults.map((u) => (
                      <button
                        key={u._id}
                        onMouseDown={() => {
                          setSelectedUser(u);
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                      >
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
                        >
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm text-snow">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-slate">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Channels */}
        <div className="mb-4">
          <label className="text-xs text-slate mb-2 block font-semibold uppercase tracking-wider">
            Channels
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {(["in-app", "email"] as Channel[]).map((ch) => (
              <button
                key={ch}
                onClick={() => toggleChannel(ch)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: channels.has(ch) ? "rgba(99,102,241,0.16)" : "rgba(255,255,255,0.04)",
                  color: channels.has(ch) ? "#A5B4FC" : "#64748B",
                  border: channels.has(ch)
                    ? "1px solid rgba(99,102,241,0.28)"
                    : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded flex items-center justify-center"
                  style={{
                    background: channels.has(ch) ? "#6366F1" : "transparent",
                    border: channels.has(ch) ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {channels.has(ch) && <span className="text-white text-[9px]">✓</span>}
                </span>
                {ch === "in-app" ? "In-App" : "Email"}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="mb-4">
          <label className="text-xs text-slate mb-2 block font-semibold uppercase tracking-wider">
            Type
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(TYPE_CONFIG) as NotifType[]).map((t) => {
              const cfg = TYPE_CONFIG[t];
              const Icon = cfg.icon;
              return (
                <button
                  key={t}
                  onClick={() => setNotifType(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: notifType === t ? cfg.bg : "rgba(255,255,255,0.04)",
                    color: notifType === t ? cfg.color : "#64748B",
                    border: notifType === t ? `1px solid ${cfg.border}` : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <Icon size={12} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="mb-3">
          <label className="text-xs text-slate mb-1.5 block">Title</label>
          <input
            type="text"
            placeholder="Notification title"
            value={notifTitle}
            onChange={(e) => setNotifTitle(e.target.value)}
            className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          />
        </div>

        {/* Message */}
        <div className="mb-5">
          <label className="text-xs text-slate mb-1.5 block">Message</label>
          <textarea
            rows={4}
            placeholder="Write your notification message here..."
            value={notifMessage}
            onChange={(e) => setNotifMessage(e.target.value)}
            className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate resize-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          />
        </div>

        {/* Feedback */}
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

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff" }}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send Notification
        </button>
      </div>

      {/* History table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3 className="text-sm font-semibold font-display text-snow">Notification History</h3>
        </div>

        {loadingHistory ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Bell size={28} className="text-slate" />
            <p className="text-sm text-slate">No notifications sent yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Date", "Target", "Title", "Type", "Status"].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={n._id}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td className="px-4 py-3 text-slate text-xs whitespace-nowrap">
                        {new Date(n.sentAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: n.targetType === "all" ? "#A5B4FC" : "#34D399" }}
                        >
                          {n.targetType === "all" ? "All Users" : "Specific User"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-silver text-xs max-w-[200px] truncate">
                        {n.title}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{
                            background: cfg.bg,
                            color: cfg.color,
                            borderColor: cfg.border,
                          }}
                        >
                          <Icon size={10} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: n.status === "sent" ? "#10B981" : "#F59E0B" }}
                        >
                          {n.status === "sent" ? "✅ Sent" : n.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
