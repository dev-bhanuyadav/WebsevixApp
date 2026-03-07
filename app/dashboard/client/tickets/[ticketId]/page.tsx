"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";
import { TicketThread } from "@/components/tickets/TicketThread";
import { TicketReplyInput } from "@/components/tickets/TicketReplyInput";

const CATEGORY_LABELS: Record<string, string> = {
  service_issue: "Service Issue",
  order_issue: "Order/Project",
  billing: "Billing",
  account: "Account",
  general: "General",
};

export default function ClientTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { accessToken } = useAuth();
  const [ticket, setTicket] = useState<Record<string, unknown> | null>(null);
  const [replies, setReplies] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadTicket = async () => {
    if (!accessToken || !ticketId) return;
    const res = await fetch(`/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const d = await res.json();
    if (d.ticket) setTicket(d.ticket);
    setReplies(d.replies ?? []);
  };

  useEffect(() => {
    if (!accessToken || !ticketId) return;
    setLoading(true);
    loadTicket().finally(() => setLoading(false));
  }, [accessToken, ticketId]);

  const handleReply = async (message: string, attachments: { url: string; name: string; size: number; mimeType: string }[]) => {
    if (!accessToken) return;
    setActionLoading("reply");
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message, attachments }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setReplies(d.replies ?? []);
      if (d.ticket) setTicket(d.ticket);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async () => {
    if (!accessToken) return;
    setActionLoading("close");
    try {
      const res = await fetch(`/api/tickets/${ticketId}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setTicket(d.ticket);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopen = async () => {
    if (!accessToken) return;
    setActionLoading("reopen");
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reopen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setTicket(d.ticket);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-slate mb-4">Ticket not found</p>
        <Link href="/dashboard/client/tickets" className="text-indigo-400 hover:underline">
          ← Back to tickets
        </Link>
      </div>
    );
  }

  const status = ticket.status as string;
  const isClosed = status === "closed";
  const isResolved = status === "resolved";
  const canReply = !isClosed;

  const assignedTo = ticket.assignedTo as { firstName?: string; lastName?: string } | null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/dashboard/client/tickets"
        className="inline-flex items-center gap-2 text-sm text-slate hover:text-silver"
      >
        <ArrowLeft size={16} /> Back to tickets
      </Link>

      <div
        className="rounded-2xl border border-white/10 p-5"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <span className="font-mono text-indigo-400 font-semibold">#{String(ticket.ticketId)}</span>
            <TicketStatusBadge status={status as "open" | "in_progress" | "waiting_client" | "resolved" | "closed" | "reopened"} />
          </div>
        </div>
        <h1 className="text-xl font-display font-bold text-snow mt-2">{String(ticket.subject)}</h1>
        <p className="text-sm text-slate mt-1">
          {CATEGORY_LABELS[String(ticket.category)]} •{" "}
          <TicketPriorityBadge priority={ticket.priority as "low" | "medium" | "high" | "critical"} />
          {assignedTo && (
            <> • Assigned to {assignedTo.firstName} {assignedTo.lastName}</>
          )}
        </p>
        <p className="text-xs text-slate/80 mt-1">
          Raised {new Date(String(ticket.createdAt)).toLocaleString()}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
        <p className="text-sm text-silver whitespace-pre-wrap">{String(ticket.description)}</p>
      </div>

      <TicketThread replies={replies as never} />

      {isResolved && (
        <motion.div
          className="rounded-xl border border-emerald-500/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: "rgba(16,185,129,0.08)" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-emerald-200">Admin marked this ticket as Resolved. Was your issue fixed?</p>
          <div className="flex gap-2">
            <button
              onClick={handleReopen}
              disabled={!!actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-amber-500/30 text-amber-300"
            >
              {actionLoading === "reopen" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Reopen
            </button>
            <button
              onClick={handleClose}
              disabled={!!actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            >
              {actionLoading === "close" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Yes, Close
            </button>
          </div>
        </motion.div>
      )}

      {canReply && (
        <TicketReplyInput
          onSend={handleReply}
          disabled={!!actionLoading}
        />
      )}

      {isClosed && (
        <p className="text-center text-sm text-slate">This ticket is closed.</p>
      )}
    </div>
  );
}
