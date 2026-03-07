"use client";

import { useState } from "react";
import { Loader2, User } from "lucide-react";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { SLATimer } from "./SLATimer";
import type { TicketStatus, TicketPriority } from "@/models/Ticket";

interface AdminTicketControlsProps {
  ticketId: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: { _id: string; firstName?: string; lastName?: string } | null;
  slaDeadline?: Date | string | null;
  isSlaBreach?: boolean;
  internalNote?: string | null;
  clientId?: { _id: string; firstName?: string; lastName?: string };
  onStatusChange: (status: TicketStatus) => Promise<void>;
  onPriorityChange: (priority: TicketPriority) => Promise<void>;
  onAssignChange: (assignedTo: string | null) => Promise<void>;
  onInternalNoteSave: (note: string) => Promise<void>;
  adminUsers?: { _id: string; firstName?: string; lastName?: string }[];
  accessToken: string | null;
}

const STATUS_OPTIONS: TicketStatus[] = ["open", "in_progress", "waiting_client", "resolved", "closed", "reopened"];
const PRIORITY_OPTIONS: TicketPriority[] = ["low", "medium", "high", "critical"];

export function AdminTicketControls({
  status,
  priority,
  assignedTo,
  slaDeadline,
  isSlaBreach,
  internalNote,
  clientId,
  onStatusChange,
  onPriorityChange,
  onAssignChange,
  onInternalNoteSave,
  adminUsers = [],
  accessToken,
}: AdminTicketControlsProps) {
  const [statusLoading, setStatusLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [internalNoteDraft, setInternalNoteDraft] = useState(internalNote ?? "");
  const [noteSaving, setNoteSaving] = useState(false);

  const clientName = clientId
    ? `${clientId.firstName ?? ""} ${clientId.lastName ?? ""}`.trim() || "Client"
    : "Client";

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <h3 className="text-sm font-semibold font-display text-snow">Ticket Controls</h3>

      <div>
        <p className="text-[11px] text-slate uppercase tracking-wider mb-2">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={async () => {
                setStatusLoading(true);
                try {
                  await onStatusChange(s);
                } finally {
                  setStatusLoading(false);
                }
              }}
              disabled={statusLoading || status === s}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                status === s ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-slate hover:bg-white/10"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] text-slate uppercase tracking-wider mb-2">Priority</p>
        <select
          value={priority}
          onChange={async (e) => {
            const v = e.target.value as TicketPriority;
            setPriorityLoading(true);
            try {
              await onPriorityChange(v);
            } finally {
              setPriorityLoading(false);
            }
          }}
          disabled={priorityLoading}
          className="w-full px-3 py-2 rounded-lg text-sm text-snow bg-white/5 border border-white/10"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {adminUsers.length > 0 && (
        <div>
          <p className="text-[11px] text-slate uppercase tracking-wider mb-2">Assigned To</p>
          <select
            value={assignedTo?._id ?? ""}
            onChange={async (e) => {
              const v = e.target.value || null;
              setAssignLoading(true);
              try {
                await onAssignChange(v);
              } finally {
                setAssignLoading(false);
              }
            }}
            disabled={assignLoading}
            className="w-full px-3 py-2 rounded-lg text-sm text-snow bg-white/5 border border-white/10"
          >
            <option value="">Unassigned</option>
            {adminUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {slaDeadline && (
        <div>
          <p className="text-[11px] text-slate uppercase tracking-wider mb-1">SLA Deadline</p>
          <p className="text-xs text-silver">{new Date(slaDeadline).toLocaleString()}</p>
          <SLATimer deadline={slaDeadline} isBreach={!!isSlaBreach} />
        </div>
      )}

      <div>
        <p className="text-[11px] text-slate uppercase tracking-wider mb-2">Internal Note (admin only)</p>
        <textarea
          value={internalNoteDraft}
          onChange={(e) => setInternalNoteDraft(e.target.value)}
          placeholder="Only visible to admins"
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm text-snow placeholder:text-slate bg-white/5 border border-amber-500/20 resize-none"
        />
        <button
          type="button"
          onClick={async () => {
            setNoteSaving(true);
            try {
              await onInternalNoteSave(internalNoteDraft);
            } finally {
              setNoteSaving(false);
            }
          }}
          disabled={noteSaving}
          className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-200 bg-amber-500/10 border border-amber-500/20"
        >
          {noteSaving ? <Loader2 size={12} className="animate-spin inline" /> : "Save Note"}
        </button>
      </div>

      {clientId && (
        <div>
          <p className="text-[11px] text-slate uppercase tracking-wider mb-1">Client</p>
          <p className="text-sm text-snow flex items-center gap-2">
            <User size={14} /> {clientName}
          </p>
          <a
            href={`/admin/users/${clientId._id}`}
            className="text-xs text-indigo-400 hover:underline mt-1 inline-block"
          >
            View Profile →
          </a>
        </div>
      )}
    </div>
  );
}
