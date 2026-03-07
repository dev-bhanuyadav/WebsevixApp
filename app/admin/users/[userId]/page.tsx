"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  ShieldOff,
  Shield,
  Package,
  DollarSign,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type OrderStatus = "pending_review" | "in_progress" | "completed" | "cancelled";

const STATUS_COLORS: Record<OrderStatus, { label: string; color: string }> = {
  pending_review: { label: "Pending Review", color: "#F59E0B" },
  in_progress: { label: "In Progress", color: "#22D3EE" },
  completed: { label: "Completed", color: "#10B981" },
  cancelled: { label: "Cancelled", color: "#EF4444" },
};

interface UserOrder {
  _id: string;
  orderId: string;
  title?: string;
  status: OrderStatus;
  budget?: string;
  createdAt: string;
  aiSummary?: { projectType?: string };
}

interface UserDetail {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface UserDetailResponse {
  user: UserDetail;
  orderCount: number;
  totalSpent: number;
  orders?: UserOrder[];
}

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { accessToken } = useAuth();

  const [userData, setUserData] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const [suspendLoading, setSuspendLoading] = useState(false);

  // Fetch user orders separately
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!accessToken || !userId) return;
    setLoading(true);

    fetch(`/api/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: UserDetailResponse & { error?: string }) => {
        if (d.error) setError(d.error);
        else setUserData(d);
      })
      .catch(() => setError("Failed to load user"))
      .finally(() => setLoading(false));
  }, [accessToken, userId]);

  useEffect(() => {
    if (!accessToken || !userId) return;
    setOrdersLoading(true);
    fetch(`/api/admin/orders?clientId=${userId}&limit=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: { orders?: UserOrder[] }) => {
        if (Array.isArray(d.orders)) setOrders(d.orders);
      })
      .catch(console.error)
      .finally(() => setOrdersLoading(false));
  }, [accessToken, userId]);

  const handleSuspendToggle = async () => {
    if (!accessToken || !userData) return;
    setSuspendLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !userData.user.isActive }),
      });
      const d = (await res.json()) as { user?: UserDetail };
      if (d.user) {
        setUserData((prev) => (prev ? { ...prev, user: d.user! } : prev));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!accessToken || !noteText.trim()) return;
    setSavingNote(true);
    try {
      await fetch(`/api/admin/users/${userId}/note`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: noteText }),
      });
      setNoteText("");
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-[600px] rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="lg:col-span-2 h-[600px] rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-silver text-sm">{error || "User not found"}</p>
        <Link href="/admin/users">
          <button className="text-xs text-indigo-400 hover:underline">← Back to Users</button>
        </Link>
      </div>
    );
  }

  const { user, orderCount, totalSpent } = userData;
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  const completedOrders = orders.filter((o) => o.status === "completed").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Back */}
      <Link href="/admin/users">
        <button className="flex items-center gap-2 text-sm text-slate hover:text-snow transition-colors">
          <ArrowLeft size={15} />
          Back to Users
        </button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Profile card */}
        <div className="flex flex-col gap-4">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="flex items-center justify-center w-20 h-20 rounded-full font-bold text-2xl text-white mb-4"
                style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
              >
                {initials}
              </div>
              <h2 className="text-lg font-semibold font-display text-snow">{fullName}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                  style={{
                    background: "rgba(99,102,241,0.12)",
                    color: "#A5B4FC",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                >
                  {user.role}
                </span>
                {user.isVerified && (
                  <span
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      color: "#10B981",
                      border: "1px solid rgba(16,185,129,0.18)",
                    }}
                  >
                    <ShieldCheck size={10} />
                    Verified
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-2.5">
                <Mail size={14} className="text-slate flex-shrink-0" />
                <span className="text-xs text-silver break-all">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone size={14} className="text-slate flex-shrink-0" />
                  <span className="text-xs text-silver">{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Calendar size={14} className="text-slate flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-slate">Member since</p>
                  <p className="text-xs text-silver">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Status + toggle */}
            <div
              className="flex items-center justify-between p-3 rounded-xl mb-5"
              style={{
                background: user.isActive ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                border: user.isActive
                  ? "1px solid rgba(16,185,129,0.16)"
                  : "1px solid rgba(239,68,68,0.16)",
              }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: user.isActive ? "#10B981" : "#EF4444" }}
              >
                {user.isActive ? "Active" : "Suspended"}
              </span>
              <button
                onClick={handleSuspendToggle}
                disabled={suspendLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                style={
                  user.isActive
                    ? {
                        background: "rgba(239,68,68,0.12)",
                        color: "#EF4444",
                        border: "1px solid rgba(239,68,68,0.22)",
                      }
                    : {
                        background: "rgba(16,185,129,0.12)",
                        color: "#10B981",
                        border: "1px solid rgba(16,185,129,0.22)",
                      }
                }
              >
                {suspendLoading ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : user.isActive ? (
                  <ShieldOff size={11} />
                ) : (
                  <Shield size={11} />
                )}
                {user.isActive ? "Suspend" : "Activate"}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Orders", value: orderCount, icon: Package, color: "#818CF8" },
                {
                  label: "Spent",
                  value: `₹${totalSpent.toLocaleString("en-IN")}`,
                  icon: DollarSign,
                  color: "#10B981",
                },
                { label: "Done", value: completedOrders, icon: CheckCircle2, color: "#34D399" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center p-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <s.icon size={14} style={{ color: s.color }} className="mb-1" />
                  <span className="text-sm font-bold text-snow">{s.value}</span>
                  <span className="text-[10px] text-slate">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Admin note */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <h3 className="text-sm font-semibold text-snow mb-3">Add Admin Note</h3>
            <textarea
              rows={4}
              placeholder="Internal note about this user..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-snow rounded-xl outline-none placeholder:text-slate resize-none mb-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
            <AnimatePresence>
              {noteSaved && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-emerald-400 mb-2"
                >
                  ✅ Note saved successfully
                </motion.p>
              )}
            </AnimatePresence>
            <button
              onClick={handleSaveNote}
              disabled={savingNote || !noteText.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                color: "#fff",
              }}
            >
              {savingNote ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save Note
            </button>
          </div>
        </div>

        {/* Right: Orders table */}
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h3 className="text-sm font-semibold font-display text-snow">
              {fullName}&apos;s Orders
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Order ID", "Project Type", "Status", "Budget", "Date"].map((col) => (
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
                {ordersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div
                            className="h-4 rounded animate-pulse"
                            style={{ background: "rgba(255,255,255,0.07)" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Package size={28} className="text-slate" />
                        <p className="text-xs text-slate">No orders yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const sc = STATUS_COLORS[order.status];
                    return (
                      <tr
                        key={order._id}
                        className="transition-colors hover:bg-white/[0.02] cursor-pointer"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onClick={() =>
                          (window.location.href = `/admin/orders/${order._id}`)
                        }
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs" style={{ color: "#818CF8" }}>
                            #{order.orderId}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-silver text-xs max-w-[140px] truncate">
                          {order.aiSummary?.projectType ?? order.title ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: sc?.color ?? "#CBD5E1" }}
                          >
                            {sc?.label ?? order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-silver text-xs">{order.budget ?? "—"}</td>
                        <td className="px-4 py-3 text-slate text-xs whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
