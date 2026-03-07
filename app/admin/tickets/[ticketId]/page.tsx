"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";
import { TicketThread } from "@/components/tickets/TicketThread";
import { TicketReplyInput } from "@/components/tickets/TicketReplyInput";
import { AdminTicketControls } from "@/components/tickets/AdminTicketControls";

const CATEGORY_LABELS: Record<string, string> = {
  service_issue: "Service Issue",
  order_issue: "Order/Project",
  billing: "Billing",
  account: "Account",
  general: "General",
};

export default function AdminTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { accessToken, user } = useAuth();
  const [ticket, setTicket] = useState<Record<string, unknown> | null>(null);
  const [replies, setReplies] = useState<Record<string, unknown>[]>([]);
  const [adminUsers, setAdminUsers] = useState<{ _id: string; firstName?: string; lastName?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [internalNote, setInternalNote] = useState(false);

  const loadTicket = async () => {
    if (!accessToken || !ticketId) return;
    const res = await fetch(`/api/admin/tickets/${ticketId}`, {
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

  useEffect(() => {
    if (!user?.id) return;
    setAdminUsers([{ _id: user.id, firstName: user.firstName, lastName: user.lastName }]);
  }, [user?.id, user?.firstName, user?.lastName]);

  const handleReply = async (message: string, attachments: { url: string; name: string; size: number; mimeType: string }[]) => {
    if (!accessToken) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message, attachments, isInternal: internalNote }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setReplies(d.replies ?? []);
      await loadTicket();
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!accessToken) return;
    const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const d = await res.json();
    if (d.ticket) setTicket(d.ticket);
  };

  const handlePriorityChange = async (priority: string) => {
    if (!accessToken) return;
    const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    const d = await res.json();
    if (d.ticket) setTicket(d.ticket);
  };

  const handleAssignChange = async (assignedTo: string | null) => {
    if (!accessToken) return;
    const res = await fetch(`/api/admin/tickets/${ticketId}/assign`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTo }),
    });
    const d = await res.json();
    if (d.ticket) setTicket(d.ticket);
  };

  const handleInternalNoteSave = async (note: string) => {
    if (!accessToken) return;
    const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ internalNote: note }),
    });
    const d = await res.json();
    if (d.ticket) setTicket(d.ticket);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-slate mb-4">Ticket not found</p>
        <Link href="/admin/tickets" className="text-indigo-400 hover:underline">← Back to tickets</Link>
      </div>
    );
  }

  const status = ticket.status as string;
  const isClosed = status === "closed";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/admin/tickets" className="inline-flex items-center gap-2 text-sm text-slate hover:text-silver">
        <ArrowLeft size={16} /> Back to tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-indigo-400 font-semibold">#{String(ticket.ticketId)}</span>
              <TicketStatusBadge status={status as "open" | "in_progress" | "waiting_client" | "resolved" | "closed" | "reopened"} />
            </div>
            <h1 className="text-xl font-display font-bold text-snow mt-2">{String(ticket.subject)}</h1>
            <p className="text-sm text-slate mt-1">
              {CATEGORY_LABELS[String(ticket.category)]} •{" "}
              <TicketPriorityBadge priority={ticket.priority as "low" | "medium" | "high" | "critical"} />
            </p>
            <p className="text-xs text-slate/80 mt-1">
              Raised {new Date(String(ticket.createdAt)).toLocaleString()} by{" "}
              {(ticket.clientId as { firstName?: string; lastName?: string })?.firstName}{" "}
              {(ticket.clientId as { firstName?: string; lastName?: string })?.lastName}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-sm text-silver whitespace-pre-wrap">{String(ticket.description)}</p>
          </div>

          <TicketThread replies={replies as never} />

          {!isClosed && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate">
                <input
                  type="checkbox"
                  checked={internalNote}
                  onChange={(e) => setInternalNote(e.target.checked)}
                />
                Send as internal note (client won&apos;t see)
              </label>
              <TicketReplyInput
                onSend={handleReply}
                disabled={sendingReply}
                placeholder={internalNote ? "Internal note..." : "Reply to client..."}
              />
            </div>
          )}
        </div>

        <div>
          <AdminTicketControls
            ticketId={String(ticket._id)}
            status={status as "open" | "in_progress" | "waiting_client" | "resolved" | "closed" | "reopened"}
            priority={ticket.priority as "low" | "medium" | "high" | "critical"}
            assignedTo={ticket.assignedTo as { _id: string; firstName?: string; lastName?: string } | null}
            slaDeadline={ticket.slaDeadline as string | null}
            isSlaBreach={!!ticket.isSlaBreach}
            internalNote={ticket.internalNote as string | null}
            clientId={ticket.clientId as { _id: string; firstName?: string; lastName?: string }}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onAssignChange={handleAssignChange}
            onInternalNoteSave={handleInternalNoteSave}
            adminUsers={adminUsers}
            accessToken={accessToken}
          />
        </div>
      </div>
    </div>
  );
}
