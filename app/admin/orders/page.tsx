"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  Eye,
  MessageSquare,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type OrderStatus = "pending_review" | "in_progress" | "completed" | "cancelled";

const STATUS: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  pending_review: {
    label: "Pending Review",
    cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-400",
  },
  in_progress: {
    label: "In Progress",
    cls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    dot: "bg-cyan-400 animate-pulse",
  },
  completed: {
    label: "Completed",
    cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    cls: "text-red-400 bg-red-500/10 border-red-500/20",
    dot: "bg-red-400",
  },
};

interface OrderClient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Order {
  _id: string;
  orderId: string;
  title?: string;
  status: OrderStatus;
  budget?: string;
  createdAt: string;
  clientId: OrderClient | null;
  aiSummary?: {
    projectType?: string;
    description?: string;
    features?: string[];
    designStyle?: string;
    timeline?: string;
  };
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pages: number;
}

const FILTER_TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Pending Review", value: "pending_review" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Budget (High)", value: "budget_desc" },
];

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded animate-pulse"
            style={{
              background: "rgba(255,255,255,0.07)",
              width: i === 0 ? "80px" : i === 1 ? "120px" : i === 6 ? "80px" : "100%",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS[status] ?? STATUS.pending_review;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function AdminOrdersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(searchParams.get("status") ?? "all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);

    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (search) params.set("search", search);
    params.set("page", String(page));

    fetch(`/api/admin/orders?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: OrdersResponse) => {
        let sorted = [...(d.orders ?? [])];
        if (sort === "oldest") sorted.reverse();
        setOrders(sorted);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, filter, search, page, sort]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [filter, search, sort]);

  const handleAccept = async (orderId: string) => {
    if (!accessToken) return;
    setActionLoading(orderId + "_accept");
    try {
      await fetch(`/api/admin/orders/${orderId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ milestones: [] }),
      });
      router.push(`/admin/orders/${orderId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!accessToken) return;
    setActionLoading(orderId + "_reject");
    try {
      await fetch(`/api/admin/orders/${orderId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Order rejected by admin" }),
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Order ID", "Client", "Project Type", "Budget", "Status", "Date"],
      ...orders.map((o) => [
        o.orderId,
        o.clientId ? `${o.clientId.firstName} ${o.clientId.lastName}` : "—",
        o.aiSummary?.projectType ?? o.title ?? "—",
        o.budget ?? "—",
        STATUS[o.status]?.label ?? o.status,
        new Date(o.createdAt).toLocaleDateString("en-IN"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clientName = (o: Order) =>
    o.clientId ? `${o.clientId.firstName} ${o.clientId.lastName}` : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
      style={{ background: "transparent", color: "#F8FAFC" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display text-snow">Orders</h1>
          <p className="text-sm text-slate mt-0.5">{total} total orders</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#CBD5E1",
          }}
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search orders, clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm text-snow bg-transparent rounded-xl outline-none placeholder:text-slate"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm text-silver rounded-xl outline-none cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} style={{ background: "#0d0d18" }}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === tab.value ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
              color: filter === tab.value ? "#A5B4FC" : "#64748B",
              border: filter === tab.value ? "1px solid rgba(99,102,241,0.28)" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Order ID", "Client", "Project Type", "Budget", "Status", "Date", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Package size={36} className="text-slate" />
                      <p className="text-sm text-slate">No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {orders.map((order, idx) => (
                    <React.Fragment key={order._id}>
                      <motion.tr
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onClick={() =>
                          setExpandedRow(expandedRow === order._id ? null : order._id)
                        }
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs" style={{ color: "#818CF8" }}>
                            #{order.orderId}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-snow text-xs font-medium">{clientName(order)}</p>
                            <p className="text-slate text-[11px]">{order.clientId?.email ?? "—"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-silver text-xs max-w-[140px] truncate">
                          {order.aiSummary?.projectType ?? order.title ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-silver text-xs">{order.budget ?? "—"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 text-slate text-xs whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link href={`/admin/orders/${order._id}`}>
                              <button
                                className="p-1.5 rounded-lg transition-colors hover:bg-indigo-500/20"
                                title="View order"
                              >
                                <Eye size={13} style={{ color: "#818CF8" }} />
                              </button>
                            </Link>
                            <Link href={`/admin/messages?id=${order._id}`}>
                              <button
                                className="p-1.5 rounded-lg transition-colors hover:bg-cyan-500/20"
                                title="Open chat"
                              >
                                <MessageSquare size={13} style={{ color: "#22D3EE" }} />
                              </button>
                            </Link>
                            {order.status === "pending_review" && (
                              <>
                                <button
                                  onClick={() => handleAccept(order._id)}
                                  disabled={actionLoading === order._id + "_accept"}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                                  style={{
                                    background: "rgba(16,185,129,0.14)",
                                    color: "#10B981",
                                    border: "1px solid rgba(16,185,129,0.25)",
                                  }}
                                >
                                  <Check size={10} />
                                  {actionLoading === order._id + "_accept" ? "..." : "Accept"}
                                </button>
                                <button
                                  onClick={() => handleReject(order._id)}
                                  disabled={actionLoading === order._id + "_reject"}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                                  style={{
                                    background: "rgba(239,68,68,0.1)",
                                    color: "#EF4444",
                                    border: "1px solid rgba(239,68,68,0.22)",
                                  }}
                                >
                                  <X size={10} />
                                  {actionLoading === order._id + "_reject" ? "..." : "Reject"}
                                </button>
                              </>
                            )}
                            {expandedRow === order._id ? (
                              <ChevronUp size={13} className="text-slate" />
                            ) : (
                              <ChevronDown size={13} className="text-slate" />
                            )}
                          </div>
                        </td>
                      </motion.tr>

                      {/* Expanded row */}
                      <AnimatePresence>
                        {expandedRow === order._id && order.aiSummary?.description && (
                          <motion.tr
                            key={`exp-${order._id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td
                              colSpan={7}
                              className="px-4 pb-4"
                              style={{ background: "rgba(255,255,255,0.015)" }}
                            >
                              <div className="pt-3 pl-2">
                                <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-1.5">
                                  AI Summary
                                </p>
                                <p className="text-sm text-silver leading-relaxed">
                                  {order.aiSummary.description}
                                </p>
                                {order.aiSummary.features && order.aiSummary.features.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {order.aiSummary.features.map((f, fi) => (
                                      <span
                                        key={fi}
                                        className="px-2 py-0.5 rounded-full text-xs"
                                        style={{
                                          background: "rgba(99,102,241,0.1)",
                                          color: "#A5B4FC",
                                          border: "1px solid rgba(99,102,241,0.18)",
                                        }}
                                      >
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-xs text-slate">
              Page {page} of {pages} · {total} orders
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "#CBD5E1",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <ChevronLeft size={13} />
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "#CBD5E1",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 rounded-2xl bg-white/[0.03]" />}>
      <AdminOrdersInner />
    </Suspense>
  );
}
