"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";
import { SLATimer } from "@/components/tickets/SLATimer";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  service_issue: "Service",
  order_issue: "Order",
  billing: "Billing",
  account: "Account",
  general: "General",
};

export default function AdminTicketsPage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState({ open: 0, active: 0, resolvedToday: 0, slaBreach: 0 });
  const [tickets, setTickets] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSla, setFilterSla] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/tickets/stats", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterSla) params.set("sla", filterSla);
    fetch(`/api/admin/tickets?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, filterStatus, filterSla]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-snow">Tickets</h1>
        <p className="text-sm text-slate mt-0.5">Support ticket management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="text-xs text-slate uppercase tracking-wider">Open</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.open}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="text-xs text-slate uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="text-xs text-slate uppercase tracking-wider">Resolved Today</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.resolvedToday}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 p-4" style={{ background: "rgba(239,68,68,0.06)" }}>
          <p className="text-xs text-red-400 uppercase tracking-wider">SLA Breached</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.slaBreach}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-snow"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_client">Waiting</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="reopened">Reopened</option>
        </select>
        <select
          value={filterSla}
          onChange={(e) => setFilterSla(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-snow"
        >
          <option value="">All SLA</option>
          <option value="at_risk">At Risk</option>
          <option value="breached">Breached</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate">
                  <th className="p-3 font-medium">ID</th>
                  <th className="p-3 font-medium">Client</th>
                  <th className="p-3 font-medium">Subject</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Priority</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">SLA</th>
                  <th className="p-3 font-medium">Assigned</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => {
                  const client = t.clientId as { firstName?: string; lastName?: string } | null;
                  const clientName = client ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() : "—";
                  const assigned = t.assignedTo as { firstName?: string; lastName?: string } | null;
                  const assignedName = assigned ? `${assigned.firstName ?? ""} ${assigned.lastName ?? ""}`.trim() : "—";
                  return (
                    <tr
                      key={String(t._id)}
                      className="border-b border-white/5 hover:bg-white/[0.02]"
                      style={t.isSlaBreach ? { background: "rgba(239,68,68,0.06)" } : {}}
                    >
                      <td className="p-3 font-mono text-indigo-400">#{String(t.ticketId)}</td>
                      <td className="p-3 text-silver">{clientName}</td>
                      <td className="p-3 text-snow max-w-[200px] truncate">{String(t.subject)}</td>
                      <td className="p-3 text-slate">{CATEGORY_LABELS[String(t.category)] ?? String(t.category)}</td>
                      <td className="p-3">
                        <TicketPriorityBadge priority={t.priority as "low" | "medium" | "high" | "critical"} />
                      </td>
                      <td className="p-3">
                        <TicketStatusBadge status={t.status as "open" | "in_progress" | "waiting_client" | "resolved" | "closed" | "reopened"} />
                      </td>
                      <td className="p-3">
                        {t.slaDeadline ? (
                          <SLATimer deadline={t.slaDeadline as string} isBreach={!!t.isSlaBreach} compact />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3 text-slate">{assignedName}</td>
                      <td className="p-3">
                        <Link
                          href={`/admin/tickets/${t._id}`}
                          className="text-indigo-400 hover:underline text-xs font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {tickets.length === 0 && (
            <div className="p-12 text-center text-slate">
              No tickets match the filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
