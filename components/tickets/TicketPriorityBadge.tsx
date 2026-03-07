"use client";

import type { TicketPriority } from "@/models/Ticket";

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; cls: string }> = {
  low:      { label: "Low",      cls: "text-slate-400 bg-slate-500/10" },
  medium:   { label: "Medium",   cls: "text-blue-400 bg-blue-500/10" },
  high:     { label: "High",     cls: "text-amber-400 bg-amber-500/10" },
  critical: { label: "Critical", cls: "text-red-400 bg-red-500/10" },
};

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
