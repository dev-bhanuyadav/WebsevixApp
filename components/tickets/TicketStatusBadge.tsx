"use client";

import type { TicketStatus } from "@/models/Ticket";

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  open:           { label: "Open",           bg: "bg-amber-500/10",  text: "text-amber-400",  dot: "bg-amber-400" },
  in_progress:    { label: "In Progress",    bg: "bg-blue-500/10",   text: "text-blue-400",   dot: "bg-blue-400" },
  waiting_client: { label: "Waiting",        bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  resolved:      { label: "Resolved",        bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  closed:         { label: "Closed",          bg: "bg-slate-500/10",  text: "text-slate-400",  dot: "bg-slate-400" },
  reopened:      { label: "Reopened",        bg: "bg-red-500/10",    text: "text-red-400",    dot: "bg-red-400" },
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
