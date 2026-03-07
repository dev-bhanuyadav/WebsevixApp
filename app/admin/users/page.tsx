"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldOff,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  orderCount?: number;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pages: number;
}

function InitialsAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white flex-shrink-0 ${dim}`}
      style={{
        background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
      }}
    >
      {initials}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded animate-pulse"
            style={{ background: "rgba(255,255,255,0.07)", width: i === 0 ? "140px" : "100%" }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [suspendLoading, setSuspendLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));

    fetch(`/api/admin/users?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d: UsersResponse) => {
        setUsers(d.users ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSuspendToggle = async (userId: string, isActive: boolean) => {
    if (!accessToken) return;
    setSuspendLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const d = (await res.json()) as { user?: User };
      if (d.user) {
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isActive: !isActive } : u)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSuspendLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-display text-snow">Users</h1>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(99,102,241,0.14)",
              color: "#A5B4FC",
              border: "1px solid rgba(99,102,241,0.22)",
            }}
          >
            {total} Clients
          </span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm text-snow bg-transparent rounded-xl outline-none placeholder:text-slate"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
        </div>
        <button
          className="px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
          style={{
            background: "rgba(99,102,241,0.14)",
            color: "#A5B4FC",
            border: "1px solid rgba(99,102,241,0.22)",
          }}
        >
          All Clients
        </button>
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
                {["User", "Email", "Orders", "Joined", "Status", "Actions"].map((col) => (
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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Users size={36} className="text-slate" />
                      <p className="text-sm text-slate">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {users.map((user, idx) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar
                            name={`${user.firstName} ${user.lastName}`}
                          />
                          <div>
                            <p className="text-sm font-medium text-snow">
                              {user.firstName} {user.lastName}
                            </p>
                            {user.phone && (
                              <p className="text-xs text-slate">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-silver text-xs">{user.email}</td>
                      <td className="px-4 py-3 text-silver text-xs">
                        {user.orderCount ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate text-xs whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={
                            user.isActive
                              ? {
                                  background: "rgba(16,185,129,0.1)",
                                  color: "#10B981",
                                  borderColor: "rgba(16,185,129,0.2)",
                                }
                              : {
                                  background: "rgba(239,68,68,0.1)",
                                  color: "#EF4444",
                                  borderColor: "rgba(239,68,68,0.2)",
                                }
                          }
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: user.isActive ? "#10B981" : "#EF4444" }}
                          />
                          {user.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/users/${user._id}`}>
                            <button
                              className="p-1.5 rounded-lg transition-colors hover:bg-indigo-500/20"
                              title="View user"
                            >
                              <Eye size={13} style={{ color: "#818CF8" }} />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleSuspendToggle(user._id, user.isActive)}
                            disabled={suspendLoading === user._id}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{
                              background: user.isActive
                                ? "rgba(239,68,68,0.08)"
                                : "rgba(16,185,129,0.08)",
                            }}
                            title={user.isActive ? "Suspend user" : "Activate user"}
                          >
                            {user.isActive ? (
                              <ShieldOff size={13} style={{ color: "#EF4444" }} />
                            ) : (
                              <Shield size={13} style={{ color: "#10B981" }} />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
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
              Page {page} of {pages} · {total} users
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
